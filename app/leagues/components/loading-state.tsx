import { Card, CardContent } from "@/components/ui/card";
import * as Icons from "@/components/icons";

export function LoadingState() {
  return (
    <Card className="w-full h-[300px] flex items-center justify-center">
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <Icons.spinner className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </CardContent>
    </Card>
  );
}
