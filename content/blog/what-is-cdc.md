---
draft: true
title: What is Change Data Capture (CDC)?
description: TODO
date_created: 2025-12-31
competencies:
  - Data Engineering
---

Change Data Capture (CDC) is a technique for tracking changes in a database.  By tracking changes, other systems can react to those changes.

Can be applied on different levels:

- Database tracks it's own changes
- Log based - External that tracks database logs, lightweight on the source DB
- Application level - write events out

`ALTER TABLE` can cause problems with CDC

TODO - example in DuckDB SQL for the power MW of a hydro turbine

Useful in streaming?

Advantages, disadvantages
