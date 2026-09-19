---
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Does this look well-designed?

```ts
// UserData class
export class UserData {
  private data: any;
  private info: any;

  // constructor
  constructor(data: any, info: any) {
    this.data = data;
    this.info = info;
  }

  // gets the data
  getData(): any {
    return this.data;
  }

  // sets the data
  setData(data: any): void {
    this.data = data;
  }

  // gets the info
  getInfo(): any {
    return this.info;
  }

  // sets the info
  setInfo(info: any): void {
    this.info = info;
  }

  // process
  process(): any {
    const tmp = { ...this.data, ...this.info };
    return tmp;
  }
}

// usage elsewhere
const u = new UserData(await api.fetchUser(id), await api.fetchPrefs(id));
const d = u.getData();
d.displayName = d.firstName + " " + d.lastName;
u.setData(d);
render(u.process());
```
