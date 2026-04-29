export const PaginationQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    size: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
}

export const TaskParamsSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
  required: ['id'],
}

export const CreateTaskBodySchema = {
  type: 'object',
  required: ['title'],
  properties: {
    title: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
    dueDate: { type: 'string' },
    dueTime: { type: 'string' },
    listId: { type: 'string', format: 'uuid' },
  },
}

export const UpdateTaskBodySchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
    dueDate: { type: 'string' },
    dueTime: { type: 'string' },
    listId: { type: 'string', format: 'uuid' },
  },
}

export const TaskResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    description: { type: 'string' },
    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
    dueDate: { type: 'string' },
    dueTime: { type: 'string' },
    dueTimezone: { type: 'string' },
    completed: { type: 'boolean' },
    completedAt: { type: 'string', format: 'date-time' },
    listId: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
}

export const TaskArrayResponseSchema = {
  type: 'array',
  items: TaskResponseSchema,
}

export const TaskListResponseSchema = {
  type: 'object',
  properties: {
    tasks: {
      type: 'array',
      items: TaskResponseSchema,
    },
    total: { type: 'integer' },
    page: { type: 'integer' },
    size: { type: 'integer' },
  },
}

export const ErrorResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    code: { type: 'string' },
  },
}