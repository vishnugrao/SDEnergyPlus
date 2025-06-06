declare module 'chartjs-node-canvas' {
    export class ChartJSNodeCanvas {
        constructor(options: { width: number; height: number });
        renderToBuffer(configuration: any): Promise<Buffer>;
    }
} 