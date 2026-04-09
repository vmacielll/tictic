import { EventEmitter } from 'events'

export interface DomainEvent {
  type: string
  occurredAt: Date
  aggregateId: string
  payload: Record<string, unknown>
}

type EventHandler = (event: DomainEvent) => void | Promise<void>

class DomainEventEmitterClass extends EventEmitter {
  publish(event: DomainEvent): boolean {
    return super.emit(event.type, event)
  }

  subscribe(eventType: string, handler: EventHandler): this {
    return super.on(eventType, handler)
  }

  subscribeOnce(eventType: string, handler: EventHandler): this {
    return super.once(eventType, handler)
  }
}

export const DomainEventEmitter = new DomainEventEmitterClass()
