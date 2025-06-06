'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Download, FileText } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface PDFExportProps {
    buildingIds: string[];
    city: string;
}

interface PDFRecord {
    filename: string;
    path: string;
    createdAt: string;
}

export function PDFExport({ buildingIds, city }: PDFExportProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfs, setPdfs] = useState<PDFRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch existing PDFs
    const fetchPDFs = async () => {
        try {
            const response = await fetch('http://localhost:5050/analysis/pdfs');
            if (!response.ok) throw new Error('Failed to fetch PDFs');
            const data = await response.json();
            setPdfs(data);
        } catch (error) {
            toast.error('Failed to fetch PDFs');
        } finally {
            setIsLoading(false);
        }
    };

    // Generate new PDF
    const generatePDF = async () => {
        try {
            setIsGenerating(true);
            const response = await fetch('http://localhost:5050/analysis/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ buildingIds, city }),
            });

            if (!response.ok) throw new Error('Failed to generate PDF');
            
            const data = await response.json();
            toast.success('PDF generated successfully');
            
            // Show insights in a toast
            if (data.insights) {
                toast.info('AI Insights', {
                    description: data.insights,
                    duration: 10000,
                });
            }
            
            // Refresh PDF list
            fetchPDFs();
        } catch (error) {
            toast.error('Failed to generate PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    // Download PDF
    const downloadPDF = async (filename: string) => {
        try {
            const response = await fetch(`http://localhost:5050/analysis/pdfs/${filename}`);
            if (!response.ok) throw new Error('Failed to download PDF');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            toast.error('Failed to download PDF');
        }
    };

    // Load PDFs on component mount
    useEffect(() => {
        fetchPDFs();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>PDF Reports</span>
                    <Button
                        onClick={generatePDF}
                        disabled={isGenerating}
                        className="flex items-center gap-2"
                    >
                        <FileText className="h-4 w-4" />
                        {isGenerating ? 'Generating...' : 'Generate PDF'}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center py-4">Loading PDFs...</div>
                ) : pdfs.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                        No PDFs generated yet
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Filename</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pdfs.map((pdf) => (
                                <TableRow key={pdf.filename}>
                                    <TableCell>{pdf.filename}</TableCell>
                                    <TableCell>
                                        {new Date(pdf.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => downloadPDF(pdf.filename)}
                                            className="flex items-center gap-2"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
} 