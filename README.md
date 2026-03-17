# run-contract-engine

A minimal runtime for managing run manifests in AI workflows.

## Features

- run manifest schema
- lifecycle state machine
- run generator
- safe manifest updates

## Background

This project was extracted from a larger experimental system called **AI Factory**,
which explores the idea of an AI-powered engineering workflow runtime.

AI Factory itself is not open source.
This package contains only the generic run lifecycle components.

## Structure

- `schema/run.schema.json`
- `runtime/run-generator.js`
- `runtime/run-state-machine.js`
- `tools/update-run-manifest.js`
- `examples/example-task.json`
- `examples/example-run.json`

## Quickstart

Generate a run manifest from a task:

~~~bash
RUN_FILE=$(node runtime/run-generator.js --task examples/example-task.json --profile default --project demo)
echo "$RUN_FILE"
cat "$RUN_FILE"
~~~

Update a run manifest safely:

~~~bash
node tools/update-run-manifest.js \
  --run-file "$RUN_FILE" \
  --patch '{"status":"in_progress","validation":{"run":"pending"}}'

cat "$RUN_FILE"
~~~

Try an invalid state transition:

~~~bash
node tools/update-run-manifest.js \
  --run-file "$RUN_FILE" \
  --patch '{"status":"pending"}'
~~~

Expected result:

~~~text
Invalid run state transition: in_progress -> pending
~~~

## Why this exists

Many agent systems can execute steps, but they lack a clear and portable run lifecycle.

`run-contract-engine` focuses on the generic contract layer:

- create run manifests
- validate them against schema
- enforce lifecycle transitions
- update manifests safely

## Status

Experimental, but already usable as a minimal building block for AI workflow runtimes.

## Requirements

- Node.js 18+

## License

MIT
