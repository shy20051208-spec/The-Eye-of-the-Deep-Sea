export function toFriendlyError(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const anyErr = err as any;
    return anyErr?.message || anyErr?.msg || "请求失败，请稍后重试";
  }
  return "请求失败，请稍后重试";
}
