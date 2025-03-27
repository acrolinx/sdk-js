export class ErrorIdGenerator {
  private readonly generatedIds: Set<number> = new Set<number>();
  private readonly idLength: number = 6;

  generateUniqueErrorId(): number {
    let newId: number;
    do {
      newId = this.generateNonZeroId();
    } while (this.generatedIds.has(newId));

    this.generatedIds.add(newId);
    return newId;
  }

  private generateNonZeroId(): number {
    let result = '';
    for (let i = 0; i < this.idLength; i++) {
      result += Math.floor(Math.random() * 9) + 1; // Generate 1-9
    }
    return parseInt(result, 10);
  }

  generateUniqueErrorIdString(): string {
    return this.generateUniqueErrorId().toString();
  }

  reset(): void {
    this.generatedIds.clear();
  }

  getGeneratedIds(): number[] {
    return Array.from(this.generatedIds);
  }
}

export const errorIdGenerator = new ErrorIdGenerator();
