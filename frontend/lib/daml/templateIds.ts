const DEFAULT_DAML_PACKAGE_ID =
  process.env.NEXT_PUBLIC_DAML_PACKAGE_ID ||
  "9837daaf0ed0c265c8f96023158d3a085a6d2b2d4fe5f9e60ad361ecc219ca94";

export function getTemplateId(moduleName: string, entityName: string): string {
  return `${DEFAULT_DAML_PACKAGE_ID}:${moduleName}:${entityName}`;
}
