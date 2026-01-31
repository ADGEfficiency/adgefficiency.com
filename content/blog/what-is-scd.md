---
title: What are Slowly Changing Dimensions (SCD)?
description: Slowly changing dimensions (SCD) are a group of techniques used to track changes to data.
date_created: 2026-01-30
competencies:
  - Data Engineering
---

**Slowly changing dimensions (SCD) are a group of techniques used to track changes to a row of data**.

There are seven SCD types from Type 0 to Type 6, which trade off accuracy, data complexity and database performance:

- **Type 0**: Never update
- **Type 1**: Overwrite, with no history kept
- **Type 2**: Add new row with version & date tracking
- **Type 3**: Add column for previous value, limited history
- **Type 4**: Keep history in separate table
- **Type 5**: Mini-dimension plus embedded current values
- **Type 6**: Hybrid of types 1, 2, and 3

## Type 0

**Type 0 is never updating your data**.

You should only use this for immutable data. If your data changes, avoid using this.

## Type 1

**Type 1 overwrites existing data with no history**.

This is actively harmful to data integrity, should be avoided except in very specific cases.

You should only use this for correcting data entry problems, or things that aren't worth keeping (like typos in a name).

## Type 2

**Type 2 adds extra rows and columns to track history**. SCD Type 2 is the gold standard for analytics.  It enables audit trails and point-in-time analysis.

In SCD Type 2 a row has (in addition to the data columns):

- **Start date**: When this version of the row became active
- **End date**: When this version was superseded
- **Is current flag**: Whether this is the latest version

Updating an existing row in a SCD type 2 table:

1. **Insert**: Add a new row with the updated values
2. **Flag**: Set the old row `is_current` to `False`
3. **Close**: Set the old row `end_date` to the change date

This will allow you to maintain a history of changes to your data over time.

Requires a `WHERE is_current = true` or a date range pattern when reading SCD 2 data.  Many modern ETL tools have SCD Type 2 built in, such as DBT snapshots or Delta Live Tables.

Type 2 will require surrogate keys, as the natural (business) key will have multiple rows over time.

```
fact table
fact_id | customer_sk | amount | transaction_date
-------------------------------------------------
1       | 1           | 500    | 2023-03-15
2       | 1           | 200    | 2024-01-10
3       | 2           | 750    | 2024-08-20

dim table, with SCD type 2
sk  | customer_id | name  | region     | start_date | end_date   | is_current
-----------------------------------------------------------------------------
1   | 1001        | Alice | California | 2023-01-01 | 2024-06-01 | false
2   | 1001        | Alice | Texas      | 2024-06-01 | NULL       | true
```

When reading data like this, you need to join on the date range to get the correct dimension record for the fact's date:

```sql
SELECT sk FROM dim_customer
WHERE customer_id = 1001
  AND transaction_date >= start_date
  AND (transaction_date < end_date OR end_date IS NULL)
```

Surrogates put the complexity of managing slowly changing dimensions into ETL (one place, tested once) rather than requiring users to correct filters in every downstream query.

When you load a fact with a transaction date in the past, after the dimension has already changed, the surrogate key lookup needs to find the historical dimension record, not the current one.

You can also skip surrogate keys in facts and do the date-range join at query time instead. Simpler ETL, but slower queries and easier to get wrong.

Risks of skipping surrogate keys:

- **Null end dates**: Drop all current period facts if you don't handle the null `end_date` in a join of fact & dimensions
- **Overlapping periods**: Facts join to multiple dimensions if the historical periods overlap

## Type 3

Add column for previous value. Limited history, can't know history at arbitrary past dates. Avoid.

## Type 4

Keep history in a separate table. Good for historical data, best when dimensions change a lot, and you often only want the current state (i.e. `is_current`).

## Type 5

Hybrid of Types 1 and 4. Uses a mini-dimension table for frequently changing attributes, with the current mini-dimension key also embedded in the main dimension (Type 1 overwrite). Useful when a small set of attributes change often and you need both current and historical views.

## Type 6

Combination of Types 1, 2, and 3. Good when you want to access the current value on the historical row, without needing a self join (like you would for Type 2).

## Deletes

SCDs typically focus on updates.

When a dimension record is deleted, options are:

- **Soft delete**: Flag the row as deleted
- **Status marker**: Keep row with "deleted" status
- **Hard delete**: Actually delete (breaks referential integrity)

## Example in DuckDB SQL

The example below shows a hydro turbine that is upgraded from 25 MW to 32 MW capacity, and how to track that with SCD Type 2:

```sql
-- Create dimension table with SCD Type 2
CREATE TABLE dim_turbine (
    sk INTEGER PRIMARY KEY,
    turbine_id VARCHAR NOT NULL,
    name VARCHAR,
    power_mw DECIMAL(10,2),
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN NOT NULL
);

-- Create fact table
CREATE TABLE fact_generation (
    fact_id INTEGER PRIMARY KEY,
    turbine_sk INTEGER NOT NULL REFERENCES dim_turbine(sk),
    generation_mwh DECIMAL(10,2),
    generation_date DATE NOT NULL
);

-- Initial turbine record
INSERT INTO dim_turbine VALUES
(1, 'HT-001', 'Karapiro 1', 25.00, '2020-01-01', NULL, true);

-- Some generation facts
INSERT INTO fact_generation VALUES
(1, 1, 450.5, '2024-01-15'),
(2, 1, 520.3, '2024-06-20');

-- Turbine gets upgraded from 25 MW to 32 MW on 2024-07-01
-- Step 1: Close out old record
UPDATE dim_turbine
SET end_date = '2024-07-01', is_current = false
WHERE turbine_id = 'HT-001' AND is_current = true;

-- Step 2: Insert new record
INSERT INTO dim_turbine VALUES
(2, 'HT-001', 'Karapiro 1', 32.00, '2024-07-01', NULL, true);

-- New generation after upgrade
INSERT INTO fact_generation VALUES
(3, 2, 610.8, '2024-08-10');

-- Query: generation with point-in-time turbine capacity
SELECT
    f.generation_date,
    d.name,
    d.power_mw AS capacity_at_time,
    f.generation_mwh,
    ROUND(f.generation_mwh / (d.power_mw * 24) * 100, 1) AS capacity_factor_pct
FROM fact_generation f
JOIN dim_turbine d ON f.turbine_sk = d.sk
ORDER BY f.generation_date;

-- Query: current state only
SELECT * FROM dim_turbine WHERE is_current = true;

-- Query: full history for a turbine
SELECT * FROM dim_turbine WHERE turbine_id = 'HT-001' ORDER BY start_date;
```

```shell-session
$ duckdb < scd.sql
┌─────────────────┬────────────┬──────────────────┬────────────────┬─────────────────────┐
│ generation_date │    name    │ capacity_at_time │ generation_mwh │ capacity_factor_pct │
│      date       │  varchar   │  decimal(10,2)   │ decimal(10,2)  │       double        │
├─────────────────┼────────────┼──────────────────┼────────────────┼─────────────────────┤
│ 2024-01-15      │ Karapiro 1 │            25.00 │         450.50 │                75.1 │
│ 2024-06-20      │ Karapiro 1 │            25.00 │         520.30 │                86.7 │
│ 2024-08-10      │ Karapiro 1 │            32.00 │         610.80 │                79.5 │
└─────────────────┴────────────┴──────────────────┴────────────────┴─────────────────────┘
┌───────┬────────────┬────────────┬───────────────┬────────────┬──────────┬────────────┐
│  sk   │ turbine_id │    name    │   power_mw    │ start_date │ end_date │ is_current │
│ int32 │  varchar   │  varchar   │ decimal(10,2) │    date    │   date   │  boolean   │
├───────┼────────────┼────────────┼───────────────┼────────────┼──────────┼────────────┤
│     2 │ HT-001     │ Karapiro 1 │         32.00 │ 2024-07-01 │ NULL     │ true       │
└───────┴────────────┴────────────┴───────────────┴────────────┴──────────┴────────────┘
┌───────┬────────────┬────────────┬───────────────┬────────────┬────────────┬────────────┐
│  sk   │ turbine_id │    name    │   power_mw    │ start_date │  end_date  │ is_current │
│ int32 │  varchar   │  varchar   │ decimal(10,2) │    date    │    date    │  boolean   │
├───────┼────────────┼────────────┼───────────────┼────────────┼────────────┼────────────┤
│     1 │ HT-001     │ Karapiro 1 │         25.00 │ 2020-01-01 │ 2024-07-01 │ false      │
│     2 │ HT-001     │ Karapiro 1 │         32.00 │ 2024-07-01 │ NULL       │ true       │
└───────┴────────────┴────────────┴───────────────┴────────────┴────────────┴────────────┘
```

## Summary

**Slowly changing dimensions are techniques for tracking how data changes over time, with each type trading off simplicity against historical accuracy**.

- **Type 0**: Never update, only for truly immutable data
- **Type 1**: Overwrite with no history, only for correcting errors
- **Type 2**: Add rows with date tracking, the gold standard for analytics
- **Type 3**: Add column for previous value, too limited to be useful
- **Type 4**: Separate history table, good when dimensions change frequently
- **Type 5**: Mini-dimension with embedded current values, hybrid of Types 1 and 4
- **Type 6**: Hybrid of Types 1, 2, and 3, gives current values on historical rows

**For most analytics use cases, Type 2 is the right choice**. It enables audit trails, point-in-time analysis, and works well with surrogate keys and modern ETL tools like dbt snapshots.

Thanks for reading!
