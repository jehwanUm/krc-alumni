// 구조화 데이터(JSON-LD). `<` 를 이스케이프해 문자열 안의 </script>가 태그를 닫지 못하게 한다.
export default function JsonLd({ data }: { data: object[] }) {
  if (!data.length) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
