export class OsfClient {
  constructor(private token: string) {}

  public get(url: string): string {
    return `Fetching ${url} with token ${this.token}`;
  }
}
