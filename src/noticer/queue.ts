export class Queue<T> {
  private queue: T[];

  constructor() {
    this.queue = [];
  }

  push(item: T): void {
    this.queue.push(item);
  }

  pop(): void {
    this.queue = this.queue.slice(1);
  }

  empty(): boolean {
    return !this.queue.length;
  }

  front(): T {
    return this.queue[0];
  }

  back(): T {
    return this.queue[this.queue.length - 1];
  }
}
