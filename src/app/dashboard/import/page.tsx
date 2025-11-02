import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download } from "lucide-react";

export default function ImportPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Import Facilities from Excel</CardTitle>
          <CardDescription>
            Upload an .xlsx file to bulk-add or update facilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">1. Download the template</p>
            <p className="text-sm text-muted-foreground">
              Make sure your data matches the format in the template file.
            </p>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download template_facilities.xlsx
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="excel-file" className="text-sm font-medium">2. Upload your file</Label>
            <div className="flex gap-2">
                <Input id="excel-file" type="file" accept=".xlsx" />
                <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload and Process
                </Button>
            </div>
          </div>
          <div className="space-y-4">
              <p className="text-sm font-medium">3. Review Import Report</p>
              <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    No report generated yet. Upload a file to see the import status.
                  </CardContent>
              </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
