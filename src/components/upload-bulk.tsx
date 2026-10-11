"use client";

import React, { useEffect, useState } from "react";

type Station = { id: string; name: string };

export default function UploadBulk() {
    const [stations, setStations] = useState<Station[]>([]);
    const [stationId, setStationId] = useState<string>("");
    const [files, setFiles] = useState<FileList | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<number>(0);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [fileStates, setFileStates] = useState<{
        name: string;
        progress: number;
        status: "pending" | "uploading" | "done" | "error";
        error?: string;
        result?: any;
    }[]>([]);

    useEffect(() => {
        fetch("/api/stations")
            .then((r) => r.json())
            .then((data) => setStations(data || []))
            .catch(() => setStations([]));
    }, []);

    function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
        setFiles(e.target.files);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setResult(null);
        setProgress(0);

        if (!stationId) {
            setError("请选择测站（Station）");
            return;
        }
        if (!files || files.length === 0) {
            setError("请选择至少一个文件");
            return;
        }

        // client-side basic validation: limit 50MB per file
        const MAX_BYTES = 50 * 1024 * 1024;
        for (let i = 0; i < files.length; i++) {
            if (files[i].size > MAX_BYTES) {
                setError(`文件过大：${files[i].name}`);
                return;
            }
        }

        // upload files sequentially to allow per-file progress tracking
        const fileArray = Array.from(files);
        const initialStates = fileArray.map((f) => ({ name: f.name, progress: 0, status: "pending" as const }));
        setFileStates(initialStates);

        const resultsAcc: any[] = [];

        try {
            setUploading(true);
            for (let idx = 0; idx < fileArray.length; idx++) {
                const file = fileArray[idx];
                // mark uploading
                setFileStates((s) => s.map((st, i) => (i === idx ? { ...st, status: "uploading", progress: 0 } : st)));

                const singleResult = await new Promise<any>((resolve, reject) => {
                    const formSingle = new FormData();
                    formSingle.append("files", file);
                    formSingle.append("stationId", stationId);

                    const xhr = new XMLHttpRequest();
                    xhr.open("POST", "/api/upload", true);

                    xhr.upload.onprogress = function (ev) {
                        if (ev.lengthComputable) {
                            const pct = Math.round((ev.loaded / ev.total) * 100);
                            setFileStates((s) => s.map((st, i) => (i === idx ? { ...st, progress: pct } : st)));
                            // update overall progress as average
                            setProgress((prev) => {
                                const states = fileStates.slice();
                                states[idx] = { ...(states[idx] || {}), progress: pct } as any;
                                const sum = states.reduce((acc, cur) => acc + (cur?.progress || 0), 0);
                                return Math.round(sum / Math.max(1, states.length));
                            });
                        }
                    };

                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                try {
                                    const body = JSON.parse(xhr.responseText || "{}");
                                    resolve(body);
                                } catch (err) {
                                    resolve({});
                                }
                            } else {
                                try {
                                    const body = JSON.parse(xhr.responseText || "{}");
                                    reject(new Error(body?.error || `上传失败: ${xhr.status}`));
                                } catch (err) {
                                    reject(new Error(`上传失败: ${xhr.status}`));
                                }
                            }
                        }
                    };

                    xhr.onerror = function () {
                        reject(new Error("网络错误，上传失败"));
                    };

                    xhr.send(formSingle);
                });

                // mark done
                setFileStates((s) => s.map((st, i) => (i === idx ? { ...st, status: "done", result: singleResult, progress: 100 } : st)));
                resultsAcc.push(singleResult);
            }

            setResult({ files: resultsAcc.flatMap((r) => (r.files ? r.files : [r])) });
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            // find first uploading index and mark error
            setFileStates((s) => s.map((st) => (st.status === "uploading" ? { ...st, status: "error", error: msg } : st)));
            setError(msg);
        } finally {
            setUploading(false);
            setProgress(100);
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>测站: </label>
                    <select value={stationId} onChange={(e) => setStationId(e.target.value)}>
                        <option value="">-- 请选择 --</option>
                        {stations.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label>选择文件（支持 CSV / XLSX / 图片等，多选）: </label>
                    <input type="file" multiple onChange={handleFiles} />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <button type="submit" disabled={uploading}>
                        {uploading ? "正在上传..." : "上传"}
                    </button>
                </div>
            </form>

            {error && (
                <div style={{ color: "#b00" }}>
                    错误: {error}
                </div>
            )}

            {uploading && (
                <div style={{ marginTop: 8 }}>
                    <div style={{ width: "100%", background: "#eee", height: 12, borderRadius: 6 }}>
                        <div style={{ width: `${progress}%`, height: 12, background: "#3b82f6", borderRadius: 6 }} />
                    </div>
                    <div style={{ marginTop: 6 }}>{progress}%</div>
                </div>
            )}

            {result && (
                <div style={{ marginTop: 12 }}>
                    <h3>上传结果</h3>
                    {result.files && Array.isArray(result.files) ? (
                        <div>
                            {result.files.map((f: any, idx: number) => (
                                <div key={idx} style={{ marginBottom: 8, padding: 8, border: "1px solid #ddd" }}>
                                    <div><strong>文件:</strong> {f.filename}</div>
                                    <div><strong>路径:</strong> {f.path}</div>
                                    <div><strong>总行数:</strong> {f.total ?? "-"}</div>
                                    <div><strong>成功写入:</strong> {f.created ?? "-"}</div>
                                    {f.errors && f.errors.length > 0 && (
                                        <div style={{ color: "#b33", marginTop: 6 }}>
                                            <strong>错误:</strong>
                                            <ul>
                                                {f.errors.map((err: string, i: number) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>
                    )}
                </div>
            )}
        </div>
    );
}
