import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer, ExternalLink } from "lucide-react";

function QRGenerator() {
    const qrUrl = window.location.origin; // Points to the main CreateComplaint page

    const downloadQR = () => {
        const canvas = document.getElementById("main-qr");
        if (!canvas) return;
        const pngUrl = canvas
            .toDataURL("image/png")
            .replace("image/png", "image/octet-stream");
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `Complaint-System-QR.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    const printWithProfile = () => {
        const canvas = document.getElementById("main-qr");
        if (!canvas) return;
        const qrPng = canvas.toDataURL("image/png");

        const profileHtml = `
            <div style="font-family: Arial, Helvetica, sans-serif; display:flex; align-items:center; gap:12px; margin-bottom:16px">
                <div style="width:56px;height:56px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #e6e6e6;padding:6px">
                    <img src="/logo.png" style="width:100%;height:100%;object-fit:contain" />
                </div>
                <div>
                    <div style="font-weight:800;font-size:18px;color:#111">BFF Support</div>
                    <div style="font-size:11px;color:#666;letter-spacing:2px;text-transform:uppercase">Admin Panel</div>
                </div>
            </div>`;

        const printable = `
            <html>
                <head>
                    <title>Print QR</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <style>
                        body{background:#0b1220;margin:0;padding:24px;-webkit-print-color-adjust:exact}
                        .card{background:#0f1724;color:#fff;padding:20px;border-radius:18px;max-width:420px;margin:0 auto}
                        .qr-wrap{background:#fff;padding:16px;border-radius:12px;display:flex;align-items:center;justify-content:center}
                        .meta{margin-top:16px;color:#9ca3af;font-size:12px}
                        @media print{ body{background:#fff} .card{box-shadow:none;border:0} }
                    </style>
                </head>
                <body>
                    <div class="card">
                        ${profileHtml}
                        <div style="text-align:center">
                            <div class="qr-wrap">
                                <img src="${qrPng}" style="width:260px;height:260px;object-fit:contain" />
                            </div>
                            <div class="meta">Scan this code to raise a new complaint or get support.</div>
                        </div>
                    </div>
                </body>
            </html>`;

        const w = window.open('', '_blank', 'width=600,height=800');
        if (!w) return;
        w.document.open();
        w.document.write(printable);
        w.document.close();
        // Give the new window a moment to render images
        w.onload = () => {
            w.focus();
            w.print();
            // Optionally close after printing
            // w.close();
        };
    };

    return (
        <div className="p-4 sm:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="max-w-md w-full">
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden group backdrop-blur-sm">
                    {/* Decorative Glow */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-700"></div>

                    <div className="relative z-10 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl sm:rounded-[1.5rem] mb-6 shadow-xl p-2">
                            <img src="/logo.png" alt="BFF Logo" className="w-full h-full object-contain" />
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
                            System QR Code
                        </h1>
                        <p className="text-slate-400 text-xs sm:text-sm mb-8 font-medium">
                            Scan this code to raise a new complaint or get support.
                        </p>

                        <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] inline-block mb-8 shadow-2xl shadow-cyan-500/10 border-4 border-slate-800/50">
                            <QRCodeCanvas
                                id="main-qr"
                                value={qrUrl}
                                size={window.innerWidth < 640 ? 180 : 240}
                                level={"H"}
                                includeMargin={true}
                                imageSettings={{
                                    src: "/logo.png",
                                    height: window.innerWidth < 640 ? 40 : 50,
                                    width: window.innerWidth < 640 ? 40 : 50,
                                    excavate: true,
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <button
                                onClick={downloadQR}
                                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all font-bold text-xs sm:text-sm"
                            >
                                <Download size={18} />
                                Download
                            </button>
                            <button
                                onClick={printWithProfile}
                                className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20"
                            >
                                <Printer size={18} />
                                Print
                            </button>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-800/50">
                            <div className="flex items-center justify-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest truncate px-4">
                                <ExternalLink size={12} className="shrink-0" />
                                <span className="truncate">URL: {qrUrl}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-6 sm:mt-8 text-slate-500 text-xs sm:text-sm font-medium">
                    Paste this QR code on all vending machines.
                </p>
            </div>
        </div>
    );
}

export default QRGenerator;
