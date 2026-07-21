export function formatDate(dateStr?: string): string {
  return dateStr ? new Date(dateStr).toLocaleDateString('zh-CN') : '';
}
