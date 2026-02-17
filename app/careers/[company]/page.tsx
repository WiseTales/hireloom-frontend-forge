export default async function CareersPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      fontFamily: "Arial"
    }}>
      <h1>Hello World</h1>
      <h2>Hireloom Career Page</h2>
      <p>Company: {company}</p>
    </div>
  );
}
