declare module 'html-pdf-node' {
    interface Options {
        format?: string;
        printBackground?: boolean;
        margin?: {
            top?: string;
            right?: string;
            bottom?: string;
            left?: string;
        };
    }

    interface File {
        content: string;
    }

    function generatePdf(file: File, options?: Options): Promise<Buffer>;

    export default {
        generatePdf
    };
} 