//向record追加内容
export function appendRecord(key: string, value: string, record: Record<string, string>): void {
   record[key] = value;
}

// 向目标 record 追加另一个 record 的键值对（重复键会覆盖）
export function appendRecordToRecord(
   source: Record<string, string>,
   target: Record<string, string>,
): void {
   // 遍历源记录，将所有键值对添加到目标记录中
   for (const [key, value] of Object.entries(source)) {
      target[key] = value;
   }
}
