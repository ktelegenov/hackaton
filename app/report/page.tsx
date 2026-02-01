import ReportClient from "./report-client";

export default function ReportPage({
  searchParams
}: {
  searchParams: { url?: string; design?: string };
}) {
  return (
    <ReportClient
      listingUrl={searchParams.url ?? ""}
      design={searchParams.design ?? "Modern Coastal"}
    />
  );
}
