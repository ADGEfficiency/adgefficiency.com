---
draft: true
title: What are/is Slowly Changing Dimensions (SCD)?
description: TODO
date_created: 2025-12-31
competencies:
  - Data Engineering
---

Slowly changing dimensions (SCD) are a group of techniques used to track changes to a row of data.

There are six techniques from Type 1 to Type 6, which trade off accuracy, data complexity, database performance:

- Type 0: Never update
- Type 1: Overwrite, with no history kept
- Type 2: Add new row with version & data tracking
- Type 3: Add column for previous value, limited history
- Type 4: Keep history in separate table
- Type 6: Hybrid of types 1, 2, and 3

Type 2 is the most common when you need audit trails or point-in-time analysis.

## Type 0

Only use for immutable data. If your data changes - avoid.

## Type 1

Actively harmful to data integrity, should be avoided except in very specific cases.

Only use for correcting data entry problems, or things that aren't worth keeping (like typos in a name).

Avoid

## Type 2

Type 2 is the most common when you need audit trails or point-in-time analysis.

A common type of SCD is SCD Type 2, where a row has (in addition to other columns):

- Start date
- End date
- Is current flag

Updating an existing row in a SCD type 2 table:

1. Insert a new row
2. Update the old row `is_current` flag to `False`
3. Update the old row `end_date`

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

When ingesting data like this, you need:

```
SELECT sk FROM dim_customer
WHERE customer_id = 1001
  AND transaction_date >= start_date
  AND (transaction_date < end_date OR end_date IS NULL)
```

Surrogates put the complexity of managing slowly changing dimensions into ETL (one place, tested once) rather than requiring users to correct filters in every downstream query.

When you load a fact with a transaction date in the past, after the dimension has already changed, the surrogate key lookup needs to find the historical dimension record, not the current one.

You can also skip surrogate keys in facts and do the date-range join at query time instead. Simpler ETL, but slower queries and easier to get wrong.

Risk dropping all current period facts if you don't handle the null `end_date` in a join of fact & dimensions.

Risk facts joining to multiple dimensions if the historical periods overlap.

Gold standard for analytics & reporting.

## Type 3

Limited, can't know history at arbitrary past dates

Avoid

## Type 4

Good for historic, best when dimensions change a lot, and you often only want the current state (ie `is_current`)

## Type 6

Good when you want to access the current value on the historical row, without needing a self join (like you would for Type2)

## Deletes

SCDs typically focus on updates. What happens when a dimension record is deleted? Options:

Soft delete (flag)
Keep row with "deleted" status
Actually delete (breaks referential integrity)

---

TODO - example in DuckDB SQL for the power MW of a hydro turbine - OR do I leave this for later???

```
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

```
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
│     2 │ HT-001     │ Karapiro 1 │         32.00 │ 2024-07-01 │          │ true       │
└───────┴────────────┴────────────┴───────────────┴────────────┴──────────┴────────────┘
┌───────┬────────────┬────────────┬───────────────┬────────────┬────────────┬────────────┐
│  sk   │ turbine_id │    name    │   power_mw    │ start_date │  end_date  │ is_current │
│ int32 │  varchar   │  varchar   │ decimal(10,2) │    date    │    date    │  boolean   │
├───────┼────────────┼────────────┼───────────────┼────────────┼────────────┼────────────┤
│     1 │ HT-001     │ Karapiro 1 │         25.00 │ 2020-01-01 │ 2024-07-01 │ false      │
│     2 │ HT-001     │ Karapiro 1 │         32.00 │ 2024-07-01 │            │ true       │
└───────┴────────────┴────────────┴───────────────┴────────────┴────────────┴────────────┘
```

TODO
- change karapiro to benmore or something
