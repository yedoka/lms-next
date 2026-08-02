import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Skeleton from "@mui/material/Skeleton";
import { PageContainer } from "@/shared/components/ui";

export default function Loading() {
  return (
    <PageContainer>
      <Skeleton width={240} height={40} sx={{ mb: 4 }} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" },
          gap: 3,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <Box sx={{ position: "relative", paddingTop: "56.25%" }}>
              <Skeleton
                variant="rectangular"
                sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              />
            </Box>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Skeleton width="40%" height={24} />
                <Skeleton width="25%" height={20} />
              </Box>
              <Skeleton width="75%" height={24} sx={{ mb: 0.5 }} />
              <Skeleton width="50%" height={20} />
            </CardContent>
          </Card>
        ))}
      </Box>
    </PageContainer>
  );
}
