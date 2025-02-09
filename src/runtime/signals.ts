type Subscriber<T> = (value: T) => void

export class Signal<T> {
  private subscribers: Array<Subscriber<T>> = []

  constructor(private value: T) {}

  subscribe(subscriber: Subscriber<T>) {
    this.subscribers.push(subscriber)

    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== subscriber)
    }
  }

  get() {
    return this.value
  }

  set(update: T | ((prevValue: T) => T)) {
    let newValue = update instanceof Function ? update(this.value) : update
    for (const subscriber of this.subscribers) {
      subscriber(newValue)
    }
  }
}
