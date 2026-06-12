# 2. Stream CSV export

- **Status:** accepted

## Context

The **exporter** must stream large CSVs through the **api** without buffering
the whole file in memory.

## Decision

Stream rows as they are read.
