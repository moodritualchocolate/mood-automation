export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const routes: Record<string, string> = {
    energy: "/exact-v30/energy.html",
    relax: "/exact-v30/relax.html",
    sleep: "/exact-v30/sleep.html",
  };
  const source = routes[slug] ?? "/exact-v30/home.html";
  return <iframe className="site-frame" style={{ display: "block", width: "100%", height: "100dvh", border: 0, background: "#fff" }} src={source} title={`MOOD ${slug}`} />;
}
