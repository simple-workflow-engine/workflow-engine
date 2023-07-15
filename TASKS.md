# Tasks

## Start Task

- Start Task is entrance of the Workflow Runtime. There should be only one Start Task in the Workflow Definition.

## End Task

- End Task is exit of the Workflow Runtime.
  There should be only one End Task in the Workflow Definition.

## Function Task

- Function Task is used to execute a any javascript function and the output is stored in the resultMap.

## Guard Task

- Guard Task is same as Function Task but it checks the result of the function code and conditionally calls the next tasks.

## Listen Task

- Listen Task is like a breakpoint of the code. Workflow Runtime stops at the Listen Task and listens for the external event to resumed. Events can be like HTTP/Kafka/Socket. (Currently only HTTP Support. In future will implement Kafka and other Wrappers)

## Wait Task

- Wait Task is used when there is parallel tasks and current task meet at the intersection. Wait Task will wait for given task to be finished, only after that it will trigger next. It has deduplication where it will only trigger next tasks one time.
