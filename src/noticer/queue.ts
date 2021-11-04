export class Queue<T> {
  private readonly queue: T[];

  constructor() {
    this.queue = [];
  }

  push(item: T): void {
    this.queue.push(item);
  }

  pop(): void {
    this.queue.splice(0, 1);
  }

  empty(): boolean {
    return !this.queue.length;
  }

  front(): T {
    return this.queue[0];
  }
}
