export type R1 = { ok: true; code: string } | { ok: false; message: string };
export type R2 = { status: "valid"; code: string } | { status: "invalid"; message: string };
declare function f1(): R1;
declare function f2(): R2;
const a = f1();
if (!a.ok) { console.log(a.message); }
const b = f2();
if (b.status === "invalid") { console.log(b.message); }
if (b.status === "valid") { console.log(b.code); }
