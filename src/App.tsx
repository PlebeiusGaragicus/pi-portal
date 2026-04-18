import { useCallback, useEffect, useMemo, useState } from "react";
import {
	addExtensionLink,
	addSkillLink,
	createAgent,
	deleteAgent,
	fetchAgent,
	fetchAgents,
	fetchCatalogExtensions,
	fetchCatalogSkills,
	fetchExtensionLinks,
	fetchFile,
	fetchHealth,
	fetchSkillLinks,
	type AgentDetail,
	type AgentListItem,
	type CatalogExtension,
	type CatalogSkill,
	type LinkEntry,
	removeExtensionLink,
	removeSkillLink,
	saveFile,
} from "./api";

type EditorTab =
	| "SYSTEM.md"
	| "pi-args"
	| "APPEND_SYSTEM.md"
	| "AGENT.md"
	| "workspace.conf";

type MainTab = "files" | "extensions" | "skills";

export function App() {
	const [dotMiRoot, setDotMiRoot] = useState<string>("");
	const [agents, setAgents] = useState<AgentListItem[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [detail, setDetail] = useState<AgentDetail | null>(null);
	const [loadErr, setLoadErr] = useState<string | null>(null);

	const [mainTab, setMainTab] = useState<MainTab>("files");
	const [tab, setTab] = useState<EditorTab>("SYSTEM.md");
	const [fileContent, setFileContent] = useState("");
	const [fileMissing, setFileMissing] = useState(false);
	const [fileDirty, setFileDirty] = useState(false);
	const [saveStatus, setSaveStatus] = useState<string | null>(null);

	const [extCatalog, setExtCatalog] = useState<CatalogExtension[]>([]);
	const [skillCatalog, setSkillCatalog] = useState<CatalogSkill[]>([]);
	const [extLinks, setExtLinks] = useState<LinkEntry[]>([]);
	const [skillLinks, setSkillLinks] = useState<LinkEntry[]>([]);

	const [createOpen, setCreateOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [modalName, setModalName] = useState("");
	const [modalWorkspace, setModalWorkspace] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState("");
	const [busy, setBusy] = useState(false);

	const refreshAgents = useCallback(async () => {
		const list = await fetchAgents();
		setAgents(list);
		return list;
	}, []);

	const refreshLinks = useCallback(async (id: string) => {
		const [e, s] = await Promise.all([fetchExtensionLinks(id), fetchSkillLinks(id)]);
		setExtLinks(e);
		setSkillLinks(s);
	}, []);

	const loadCatalogs = useCallback(async () => {
		const [ex, sk] = await Promise.all([fetchCatalogExtensions(), fetchCatalogSkills()]);
		setExtCatalog(ex);
		setSkillCatalog(sk);
	}, []);

	useEffect(() => {
		(async () => {
			try {
				setLoadErr(null);
				const h = await fetchHealth();
				setDotMiRoot(h.dotMiRoot);
				await loadCatalogs();
				await refreshAgents();
			} catch (e) {
				setLoadErr(e instanceof Error ? e.message : String(e));
			}
		})();
	}, [loadCatalogs, refreshAgents]);

	const selectAgent = useCallback(
		async (id: string) => {
			setSelectedId(id);
			setSaveStatus(null);
			setMainTab("files");
			setTab("SYSTEM.md");
			setFileDirty(false);
			try {
				setLoadErr(null);
				const d = await fetchAgent(id);
				setDetail(d);
				await refreshLinks(id);
			} catch (e) {
				setLoadErr(e instanceof Error ? e.message : String(e));
			}
		},
		[refreshLinks],
	);

	useEffect(() => {
		if (!selectedId || mainTab !== "files") return;
		let cancelled = false;
		(async () => {
			try {
				setSaveStatus(null);
				const f = await fetchFile(selectedId, tab);
				if (cancelled) return;
				setFileContent(f.content);
				setFileMissing(f.missing);
				setFileDirty(false);
			} catch (e) {
				if (!cancelled) setLoadErr(e instanceof Error ? e.message : String(e));
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [selectedId, tab, mainTab]);

	const onSave = async () => {
		if (!selectedId) return;
		setBusy(true);
		setSaveStatus(null);
		try {
			await saveFile(selectedId, tab, fileContent);
			setFileDirty(false);
			setFileMissing(false);
			setSaveStatus("Saved");
			const d = await fetchAgent(selectedId);
			setDetail(d);
		} catch (e) {
			setSaveStatus(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	};

	const onCreate = async () => {
		const name = modalName.trim();
		if (!name) return;
		setBusy(true);
		try {
			setLoadErr(null);
			await createAgent(name, modalWorkspace);
			setCreateOpen(false);
			setModalName("");
			setModalWorkspace(false);
			const list = await refreshAgents();
			if (list.some((a) => a.id === name)) await selectAgent(name);
		} catch (e) {
			setLoadErr(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	};

	const onDelete = async () => {
		if (!selectedId || deleteConfirm !== selectedId) return;
		setBusy(true);
		try {
			setLoadErr(null);
			await deleteAgent(selectedId);
			setDeleteOpen(false);
			setDeleteConfirm("");
			setSelectedId(null);
			setDetail(null);
			await refreshAgents();
		} catch (e) {
			setLoadErr(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	};

	const linkedExtNames = useMemo(() => new Set(extLinks.map((x) => x.name)), [extLinks]);
	const linkedSkillNames = useMemo(() => new Set(skillLinks.map((x) => x.name)), [skillLinks]);

	const addExt = async (name: string) => {
		if (!selectedId) return;
		setBusy(true);
		try {
			setLoadErr(null);
			await addExtensionLink(selectedId, name);
			await refreshLinks(selectedId);
		} catch (e) {
			setLoadErr(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	};

	const addSk = async (name: string) => {
		if (!selectedId) return;
		setBusy(true);
		try {
			setLoadErr(null);
			await addSkillLink(selectedId, name);
			await refreshLinks(selectedId);
		} catch (e) {
			setLoadErr(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	};

	const rmExt = async (name: string) => {
		if (!selectedId) return;
		setBusy(true);
		try {
			setLoadErr(null);
			await removeExtensionLink(selectedId, name);
			await refreshLinks(selectedId);
		} catch (e) {
			setLoadErr(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	};

	const rmSk = async (name: string) => {
		if (!selectedId) return;
		setBusy(true);
		try {
			setLoadErr(null);
			await removeSkillLink(selectedId, name);
			await refreshLinks(selectedId);
		} catch (e) {
			setLoadErr(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	};

	const editorTabs: { id: EditorTab; label: string }[] = [
		{ id: "SYSTEM.md", label: "SYSTEM.md" },
		{ id: "pi-args", label: "pi-args" },
		{ id: "APPEND_SYSTEM.md", label: "APPEND_SYSTEM.md" },
		{ id: "AGENT.md", label: "AGENT.md" },
		{ id: "workspace.conf", label: "workspace.conf" },
	];

	return (
		<div className="layout">
			<header className="topbar">
				<h1>pi-portal</h1>
				<span className="meta" title={dotMiRoot}>
					{dotMiRoot ? `DOT_MI_ROOT=${dotMiRoot}` : "…"}
				</span>
			</header>

			<aside className="sidebar">
				<button type="button" className="primary" onClick={() => setCreateOpen(true)}>
					+ New agent
				</button>
				<ul className="agent-list">
					{agents.map((a) => (
						<li key={a.id}>
							<button
								type="button"
								className={selectedId === a.id ? "active" : ""}
								onClick={() => void selectAgent(a.id)}
							>
								<span>{a.id}</span>
								{a.workspace ? <span className="badge">workspace</span> : null}
							</button>
						</li>
					))}
				</ul>
			</aside>

			<main>
				{loadErr ? (
					<p className="hint" style={{ color: "var(--danger)" }}>
						{loadErr}
					</p>
				) : null}

				{!selectedId || !detail ? (
					<div className="empty-state">Select an agent or create one.</div>
				) : (
					<>
						<div className="toolbar" style={{ marginBottom: "1rem" }}>
							<strong>{detail.id}</strong>
							<span className="hint">{detail.path}</span>
							<button type="button" className="danger" onClick={() => setDeleteOpen(true)}>
								Delete agent…
							</button>
						</div>

						<div className="tabs">
							<button
								type="button"
								className={mainTab === "files" ? "active" : ""}
								onClick={() => setMainTab("files")}
							>
								Files
							</button>
							<button
								type="button"
								className={mainTab === "extensions" ? "active" : ""}
								onClick={() => setMainTab("extensions")}
							>
								Extensions
							</button>
							<button
								type="button"
								className={mainTab === "skills" ? "active" : ""}
								onClick={() => setMainTab("skills")}
							>
								Skills
							</button>
						</div>

						{mainTab === "files" ? (
							<section className="panel">
								<div className="tabs">
									{editorTabs.map((t) => (
										<button
											key={t.id}
											type="button"
											className={tab === t.id ? "active" : ""}
											onClick={() => setTab(t.id)}
										>
											{t.label}
										</button>
									))}
								</div>
								{fileMissing ? (
									<p className="hint">File did not exist — saving will create it.</p>
								) : null}
								<div className="editor-wrap">
									<div className="toolbar">
										<button type="button" disabled={busy || !fileDirty} onClick={() => void onSave()}>
											Save
										</button>
										<span
											className={`status ${saveStatus && saveStatus !== "Saved" ? "error" : ""} ${saveStatus === "Saved" ? "ok" : ""}`}
										>
											{saveStatus ?? (fileDirty ? "Unsaved changes" : "")}
										</span>
									</div>
									<textarea
										value={fileContent}
										onChange={(e) => {
											setFileContent(e.target.value);
											setFileDirty(true);
											setSaveStatus(null);
										}}
										spellCheck={false}
									/>
								</div>
							</section>
						) : null}

						{mainTab === "extensions" ? (
							<section className="panel">
								<h2>Extensions</h2>
								<p className="hint">
									Symlinks into <code>shared/extensions</code>. Remove link only unlinks symlinks.
								</p>
								<div className="table-wrap">
									<table>
										<thead>
											<tr>
												<th>Name</th>
												<th>Kind</th>
												<th>Target</th>
												<th />
											</tr>
										</thead>
										<tbody>
											{extLinks.map((row) => (
												<tr key={row.name}>
													<td className="mono">{row.name}</td>
													<td>
														{row.kind}
														{row.linksToShared ? " · shared" : ""}
													</td>
													<td className="mono">{row.linkTarget ?? "—"}</td>
													<td>
														{row.kind === "symlink" ? (
															<button type="button" onClick={() => void rmExt(row.name)}>
																Remove link
															</button>
														) : (
															<span className="hint">local</span>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								<div className="add-row">
									<select
										aria-label="Add extension"
										defaultValue=""
										onChange={(ev) => {
											const v = ev.target.value;
											ev.target.value = "";
											if (v) void addExt(v);
										}}
									>
										<option value="">Add symlink…</option>
										{extCatalog
											.filter((x) => !linkedExtNames.has(x.name))
											.map((x) => (
												<option key={x.name} value={x.name}>
													{x.name} ({x.kind})
												</option>
											))}
									</select>
								</div>
							</section>
						) : null}

						{mainTab === "skills" ? (
							<section className="panel">
								<h2>Skills</h2>
								<p className="hint">Symlinks into <code>shared/skills</code>.</p>
								<div className="table-wrap">
									<table>
										<thead>
											<tr>
												<th>Name</th>
												<th>Kind</th>
												<th>Target</th>
												<th />
											</tr>
										</thead>
										<tbody>
											{skillLinks.map((row) => (
												<tr key={row.name}>
													<td className="mono">{row.name}</td>
													<td>
														{row.kind}
														{row.linksToShared ? " · shared" : ""}
													</td>
													<td className="mono">{row.linkTarget ?? "—"}</td>
													<td>
														{row.kind === "symlink" ? (
															<button type="button" onClick={() => void rmSk(row.name)}>
																Remove link
															</button>
														) : (
															<span className="hint">local</span>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								<div className="add-row">
									<select
										aria-label="Add skill"
										defaultValue=""
										onChange={(ev) => {
											const v = ev.target.value;
											ev.target.value = "";
											if (v) void addSk(v);
										}}
									>
										<option value="">Add symlink…</option>
										{skillCatalog
											.filter((x) => !linkedSkillNames.has(x.name))
											.map((x) => (
												<option key={x.name} value={x.name}>
													{x.nameFm ? `${x.name} (${x.nameFm})` : x.name}
												</option>
											))}
									</select>
								</div>
							</section>
						) : null}
					</>
				)}
			</main>

			{createOpen ? (
				<div className="modal-backdrop" role="presentation" onClick={() => !busy && setCreateOpen(false)}>
					<div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
						<h3>Create agent</h3>
						<label htmlFor="new-name">Name</label>
						<input
							id="new-name"
							type="text"
							value={modalName}
							onChange={(e) => setModalName(e.target.value)}
							placeholder="my-agent"
							autoComplete="off"
						/>
						<label className="checkbox">
							<input
								type="checkbox"
								checked={modalWorkspace}
								onChange={(e) => setModalWorkspace(e.target.checked)}
							/>
							Workspace mode (creates workspace.conf)
						</label>
						<div className="actions">
							<button type="button" disabled={busy} onClick={() => setCreateOpen(false)}>
								Cancel
							</button>
							<button type="button" disabled={busy || !modalName.trim()} onClick={() => void onCreate()}>
								Create
							</button>
						</div>
					</div>
				</div>
			) : null}

			{deleteOpen && selectedId ? (
				<div className="modal-backdrop" role="presentation" onClick={() => !busy && setDeleteOpen(false)}>
					<div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
						<h3>Delete agent</h3>
						<p className="hint">
							This removes the entire directory for <strong>{selectedId}</strong>. Type the name to confirm.
						</p>
						<label htmlFor="del-confirm">Agent name</label>
						<input
							id="del-confirm"
							type="text"
							value={deleteConfirm}
							onChange={(e) => setDeleteConfirm(e.target.value)}
							autoComplete="off"
						/>
						<div className="actions">
							<button type="button" disabled={busy} onClick={() => setDeleteOpen(false)}>
								Cancel
							</button>
							<button
								type="button"
								className="danger"
								disabled={busy || deleteConfirm !== selectedId}
								onClick={() => void onDelete()}
							>
								Delete permanently
							</button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
