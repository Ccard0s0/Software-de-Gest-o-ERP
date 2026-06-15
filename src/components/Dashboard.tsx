import React, {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  MouseEvent,
} from "react";
import Swal from "sweetalert2";

// @ts-ignore
import { supabase } from "../supabaseClient";

const BRAND_UUID_MAP: Record<string, string> = {
  nomad: "236cfb9a-2ac-48de-bcbd-1f651ef4664e",
  communities: "56f31452-acc2-467f-b914-d9587672c373",
  sinfon: "a63174db-32f9-41f9-b3c1-120f434bd0ba",
  factor: "eeb7d598-8bac-4c61-aeef-bd4d658c973b",
};

interface Brand {
  id: string;
  name: string;
  slug: string;
  type: "empresa" | "marca";
  color: string;
  folders: string[];
}

interface FileItem {
  id: string;
  brandId: string;
  folderName: string;
  fileName: string;
  fileUrl: string;
  size: string;
  createdAt: string;
}

interface Activity {
  id: string;
  user: string;
  action: string;
  fileName: string;
  folderName: string;
  brandName: string;
  time: string;
}

interface DashboardProps {
  user: {
    email?: string;
  } | null;
  onSignOut: () => void;
}

export default function Dashboard({ user, onSignOut }: DashboardProps) {
  const [brands, setBrands] = useState<Brand[]>([
    {
      id: "nomad",
      name: "Nomad Engenuity",
      slug: "nomad",
      type: "empresa",
      color: "#cd1eb9",
      folders: ["Logos", "Vídeos"],
    },
    {
      id: "factor",
      name: "Factor.AI",
      slug: "factor-ai",
      type: "marca",
      color: "#E9644A",
      folders: ["Logos", "Vídeos"],
    },
    {
      id: "sinfon",
      name: "Sinfon.IA",
      slug: "sinfon-ia",
      type: "marca",
      color: "#3b82f6",
      folders: ["Logos", "Vídeos"],
    },
    {
      id: "communities",
      name: "Communities",
      slug: "communities",
      type: "empresa",
      color: "#5bbfeb",
      folders: ["Logos", "Vídeos"],
    },
  ]);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);

  const [currentView, setCurrentView] = useState<"hub" | "brand-view">("hub");
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeBrand = brands.find((b) => b.id === selectedBrandId);

  const currentFiles = files.filter(
    (f) => f.brandId === selectedBrandId && f.folderName === selectedFolderName,
  );

  const handleAddNewEntity = async (type: "empresa" | "marca") => {
    const titleText = type === "empresa" ? "Nova Empresa" : "Nova Marca";
    const placeholderText =
      type === "empresa" ? "Nome da Empresa" : "Nome da Marca";

    const { value: entityName } = await Swal.fire({
      title: titleText,
      input: "text",
      inputPlaceholder: placeholderText,
      showCancelButton: true,
      confirmButtonText: "Adicionar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#6366F1",
      cancelButtonColor: "#475569",
      background: "#1E293B",
      color: "#FFFFFF",
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "Precisas de introduzir um nome válido!";
        }
      },
    });

    if (!entityName) return;

    const slug = entityName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    const generatedId = slug + "_" + Date.now();

    const randomColors = [
      "#ec4899",
      "#8b5cf6",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
    ];
    const randomColor =
      randomColors[Math.floor(Math.random() * randomColors.length)];

    const newEntity: Brand = {
      id: generatedId,
      name: entityName.trim(),
      slug: slug,
      type: type,
      color: randomColor,
      folders: ["Logos", "Vídeos"],
    };

    setBrands((prev) => [...prev, newEntity]);

    Swal.fire({
      title: "Adicionado!",
      text: `A estrutura para "${entityName.trim()}" foi criada com sucesso localmente.`,
      icon: "success",
      confirmButtonColor: "#6366F1",
      background: "#1E293B",
      color: "#FFFFFF",
    });
  };

  const handleDeleteEntity = async (
    e: MouseEvent<HTMLButtonElement | HTMLSpanElement>,
    id: string,
    name: string,
  ) => {
    e.stopPropagation();

    const { isConfirmed } = await Swal.fire({
      title: `Eliminar ${name}?`,
      text: "Tens a certeza? Esta ação irá remover este item da listagem lateral.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, eliminar!",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#475569",
      background: "#1E293B",
      color: "#FFFFFF",
    });

    if (!isConfirmed) return;

    setBrands((prev) => prev.filter((b) => b.id !== id));

    if (selectedBrandId === id) {
      setCurrentView("hub");
      setSelectedBrandId(null);
    }

    Swal.fire({
      title: "Eliminado!",
      text: `O item "${name}" foi removido com sucesso.`,
      icon: "success",
      confirmButtonColor: "#6366F1",
      background: "#1E293B",
      color: "#FFFFFF",
    });
  };

  useEffect(() => {
    async function loadAllFiles() {
      setLoadingFiles(true);
      try {
        const { data, error } = await supabase.from("files").select("*");
        if (error) throw error;

        const getFrontendBrandId = (dbUuid: string): string => {
          return (
            Object.keys(BRAND_UUID_MAP).find(
              (key) => BRAND_UUID_MAP[key] === dbUuid,
            ) || dbUuid
          );
        };

        const maps: FileItem[] = (data || []).map((f: any) => {
          let displaySize = "0 KB";
          if (f.tamanho_bytes) {
            const sizeInMB = f.tamanho_bytes / (1024 * 1024);
            displaySize =
              sizeInMB > 0.1
                ? `${sizeInMB.toFixed(2)} MB`
                : `${(f.tamanho_bytes / 1024).toFixed(0)} KB`;
          }

          return {
            id: String(f.id),
            brandId: getFrontendBrandId(f.brand_id),
            folderName: f.folder_name || "",
            fileName: f.file_name || "",
            fileUrl: f.file_url || "",
            size: displaySize,
            createdAt: f.created_at || "",
          };
        });
        setFiles(maps);

        const mockActivities: Activity[] = (data || [])
          .slice(-5)
          .reverse()
          .map((f: any, index: number) => {
            const frontendBrandId = getFrontendBrandId(f.brand_id);
            const brandObj = brands.find((b) => b.id === frontendBrandId);

            const dbDate = f.created_at ? new Date(f.created_at) : new Date();
            const formattedTime =
              dbDate.toLocaleDateString("pt-PT") +
              " às " +
              dbDate.toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit",
              });

            return {
              id: `act-${index}-${Date.now()}`,
              user: "Administrador",
              action: "adicionou",
              fileName: f.file_name || "",
              folderName: f.folder_name || "",
              brandName: brandObj ? brandObj.name : "Entidade",
              time: formattedTime,
            };
          });
        setActivities(mockActivities);
      } catch (err: any) {
        console.error("Erro ao ler a Base de Dados:", err.message);
      } finally {
        setLoadingFiles(false);
      }
    }
    loadAllFiles();
  }, [brands]);

  const handleOpenBrandPage = (brandId: string) => {
    setSelectedBrandId(brandId);
    const brand = brands.find((b) => b.id === brandId);
    setSelectedFolderName(brand?.folders[0] || "");
    setCurrentView("brand-view");
  };

  const handleAddFolder = () => {
    const folderName = prompt("Introduz o nome da nova pasta:");
    if (!folderName || folderName.trim() === "") return;
    const trimmed = folderName.trim();

    if (activeBrand?.folders.includes(trimmed)) {
      alert("Essa pasta já existe!");
      return;
    }

    setBrands((prev) =>
      prev.map((b) =>
        b.id === selectedBrandId
          ? { ...b, folders: [...b.folders, trimmed] }
          : b,
      ),
    );
    setSelectedFolderName(trimmed);
  };

  const handleEliminarFolder = async (
    e: MouseEvent<HTMLButtonElement>,
    folderName: string,
  ) => {
    e.stopPropagation();
    const confirmado = window.confirm(
      `ATENÇÃO: Tens a certeza que queres eliminar a pasta "${folderName}"? Todos os ficheiros dentro desta pasta serão apagados permanentemente.`,
    );
    if (!confirmado) return;

    try {
      if (!selectedBrandId) return;
      const targetUuid = BRAND_UUID_MAP[selectedBrandId];
      if (!targetUuid) {
        throw new Error(
          `Não foi encontrado um UUID configurado para a correspondente a: "${selectedBrandId}"`,
        );
      }

      const filesInFolder = files.filter(
        (f) => f.brandId === selectedBrandId && f.folderName === folderName,
      );
      if (filesInFolder.length > 0) {
        const pathsToRemove = filesInFolder.map((f) => {
          return `${selectedBrandId}/${folderName}/${f.fileName}`;
        });

        await supabase.storage.from("ficheiros-marcas").remove(pathsToRemove);
      }

      const { error } = await supabase
        .from("files")
        .delete()
        .eq("brand_id", targetUuid)
        .eq("folder_name", folderName);

      if (error) throw error;

      const logDate = new Date();
      const timeString = `${logDate.toLocaleDateString("pt-PT")} às ${logDate.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`;

      setActivities((prev) => [
        {
          id: `act-del-folder-${Date.now()}`,
          user: user?.email || "cardoso200614@gmail.com",
          action: "eliminou_pasta",
          fileName: "",
          folderName: folderName,
          brandName: activeBrand?.name || "Entidade",
          time: timeString,
        },
        ...prev,
      ]);

      setBrands((prev) =>
        prev.map((b) =>
          b.id === selectedBrandId
            ? { ...b, folders: b.folders.filter((f) => f !== folderName) }
            : b,
        ),
      );

      setFiles((prev) =>
        prev.filter(
          (f) =>
            !(f.brandId === selectedBrandId && f.folderName === folderName),
        ),
      );

      if (selectedFolderName === folderName) {
        const remainingFolders =
          activeBrand?.folders.filter((f) => f !== folderName) || [];
        setSelectedFolderName(remainingFolders[0] || "");
      }

      alert(`Pasta "${folderName}" eliminada com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao eliminar a pasta:", error.message);
      alert(`Não foi possível eliminar a pasta: ${error.message}`);
    }
  };

  const handleEliminarFile = async (fileId: string, fileName: string) => {
    const confirmado = window.confirm(
      `Tens a certeza que queres apagar o ficheiro "${fileName}"?`,
    );
    if (!confirmado) return;

    try {
      const fileToDel = files.find((f) => f.id === fileId);
      if (fileToDel) {
        const parts = fileToDel.fileUrl.split("/ficheiros-marcas/");
        if (parts.length > 1) {
          const storagePath = decodeURIComponent(parts[1]);
          await supabase.storage.from("ficheiros-marcas").remove([storagePath]);
        }
      }

      const { error } = await supabase.from("files").delete().eq("id", fileId);
      if (error) throw error;

      const logDate = new Date();
      const timeString = `${logDate.toLocaleDateString("pt-PT")} às ${logDate.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`;

      setActivities((prev) => [
        {
          id: `act-del-${Date.now()}`,
          user: user?.email || "cardoso200614@gmail.com",
          action: "eliminou",
          fileName: fileName,
          folderName: selectedFolderName,
          brandName: activeBrand?.name || "Entidade",
          time: timeString,
        },
        ...prev,
      ]);

      setFiles((prev) => prev.filter((f) => f.id !== fileId));

      Swal.fire({
        title: "Apagado!",
        text: "O arquivo foi removido com sucesso do servidor.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        background: "#1E293B",
        color: "#FFFFFF",
      });
    } catch (error: any) {
      console.error("Erro ao apagar ficheiro:", error.message);
      alert(`Erro ao apagar: ${error.message}`);
    }
  };

  const handleMoverFile = async (fileId: string) => {
    const empresas: Record<string, string> = {};
    const marcas: Record<string, string> = {};

    brands.forEach((b) => {
      if (b.type === "empresa") {
        empresas[b.id] = b.name;
      } else {
        marcas[b.id] = b.name;
      }
    });

    const { value: destinoId } = await Swal.fire({
      title: "Mover Ficheiro",
      text: "Selecione o destino do ficheiro:",
      input: "select",
      inputOptions: {
        Empresas: empresas,
        Marcas: marcas,
      },
      inputValue: selectedBrandId || "",
      showCancelButton: true,
      confirmButtonText: "Seguinte ➡",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#6366F1",
      cancelButtonColor: "#475569",
      background: "#1E293B",
      color: "#FFFFFF",
    });

    if (!destinoId) return;

    const alvo = brands.find((b) => b.id === destinoId);

    if (!alvo || alvo.folders.length === 0) {
      Swal.fire({
        title: "Aviso",
        text: "O destino selecionado não possui nenhuma pasta criada para receber ficheiros.",
        icon: "warning",
        confirmButtonColor: "#6366F1",
        background: "#1E293B",
        color: "#FFFFFF",
      });
      return;
    }

    const opcoesPastas: Record<string, string> = {};
    alvo.folders.forEach((pasta) => {
      opcoesPastas[pasta] = pasta;
    });

    const { value: novaPastaDestino } = await Swal.fire({
      title: "Selecionar Pasta",
      text: `Escolha a pasta de destino dentro de: ${alvo.name}`,
      input: "select",
      inputOptions: opcoesPastas,
      inputPlaceholder: "Escolha a pasta...",
      showCancelButton: true,
      confirmButtonText: "Confirmar e Mover",
      cancelButtonText: "Voltar",
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#475569",
      background: "#1E293B",
      color: "#FFFFFF",
    });

    if (!novaPastaDestino) return;

    try {
      const targetUuid = BRAND_UUID_MAP[destinoId];
      if (!targetUuid) {
        throw new Error(
          `Não foi encontrado mapeamento UUID para o destino: "${destinoId}"`,
        );
      }

      const { error } = await supabase
        .from("files")
        .update({
          brand_id: targetUuid,
          folder_name: novaPastaDestino,
        })
        .eq("id", fileId);

      if (error) throw error;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, brandId: destinoId, folderName: novaPastaDestino }
            : f,
        ),
      );

      Swal.fire({
        title: "Movido com sucesso!",
        text: `O ficheiro foi transferido para ${alvo.name} na pasta /${novaPastaDestino}.`,
        icon: "success",
        confirmButtonColor: "#6366F1",
        background: "#1E293B",
        color: "#FFFFFF",
      });
    } catch (error: any) {
      console.error("Erro ao mover ficheiro:", error.message);
      Swal.fire({
        title: "Erro na operação",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#EF4444",
        background: "#1E293B",
        color: "#FFFFFF",
      });
    }
  };

  const triggerFileSelection = () => {
    if (!selectedFolderName) {
      alert("Seleciona uma pasta primeiro!");
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRealFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const uploadedFile = selectedFiles[0];
    const fileExtension = uploadedFile.name.split(".").pop() || "";
    const cleanName = uploadedFile.name
      .replace(`.${fileExtension}`, "")
      .replace(/[^a-zA-Z0-9]/g, "_");

    const storagePath = `${selectedBrandId}/${selectedFolderName}/${Date.now()}_${cleanName}.${fileExtension}`;

    try {
      const { error: storageError } = await supabase.storage
        .from("ficheiros-marcas")
        .upload(storagePath, uploadedFile, {
          upsert: true,
          cacheControl: "3600",
        });

      if (storageError) throw storageError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("ficheiros-marcas").getPublicUrl(storagePath);

      const sizeInMB = uploadedFile.size / (1024 * 1024);
      const displaySize =
        sizeInMB > 0.1
          ? `${sizeInMB.toFixed(2)} MB`
          : `${(uploadedFile.size / 1024).toFixed(0)} KB`;

      if (!selectedBrandId) return;
      const targetUuid = BRAND_UUID_MAP[selectedBrandId];
      if (!targetUuid) {
        throw new Error(
          `Não foi possível realizar o upload. UUID não configurado para: "${selectedBrandId}"`,
        );
      }

      const { data: dbData, error: dbError } = await supabase
        .from("files")
        .insert([
          {
            brand_id: targetUuid,
            folder_name: selectedFolderName,
            file_name: uploadedFile.name,
            file_url: publicUrl,
            tamanho_bytes: uploadedFile.size,
          },
        ])
        .select();

      if (dbError) throw dbError;

      if (dbData && dbData[0]) {
        const newFileObj: FileItem = {
          id: String(dbData[0].id),
          brandId: selectedBrandId,
          folderName: selectedFolderName,
          fileName: uploadedFile.name,
          fileUrl: publicUrl,
          size: displaySize,
          createdAt: dbData[0].created_at || "",
        };
        setFiles((prev) => [...prev, newFileObj]);

        const logDate = dbData[0].created_at
          ? new Date(dbData[0].created_at)
          : new Date();
        const timeString = `${logDate.toLocaleDateString("pt-PT")} às ${logDate.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`;

        setActivities((prev) => [
          {
            id: `act-${Date.now()}`,
            user: user?.email || "cardoso200614@gmail.com",
            action: "adicionou",
            fileName: uploadedFile.name,
            folderName: selectedFolderName,
            brandName: activeBrand?.name || "Entidade",
            time: timeString,
          },
          ...prev,
        ]);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Erro: ${error.message}`);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const totalFiles = files.length || 1;
  let accumulatedPercentage = 0;
  const gradientParts = brands.map((b) => {
    const count = files.filter((f) => f.brandId === b.id).length;
    const pct = Math.round((count / totalFiles) * 100);
    const start = accumulatedPercentage;
    accumulatedPercentage += pct;
    return `${b.color} ${start}% ${accumulatedPercentage}%`;
  });
  const conicGradientValue = gradientParts.length
    ? `conic-gradient(${gradientParts.join(", ")}, #1E293B ${accumulatedPercentage}% 100%)`
    : "";

  return (
    <div className="flex h-screen w-full font-sans antialiased overflow-hidden bg-[#0A0915] text-slate-200">
      <style>{`
        .swal2-select, .swal2-input {
          background-color: #1E293B !important;
          color: #FFFFFF !important;
          border: 1px solid #475569 !important;
          border-radius: 12px !important;
          padding: 10px !important;
        }
        .swal2-popup {
          border-radius: 24px !important;
          font-family: sans-serif !important;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #1E293B;
          border-radius: 99px;
        }
        .entity-btn .delete-btn {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .entity-btn:hover .delete-btn {
          opacity: 1;
        }
      `}</style>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleRealFileUpload}
        className="hidden"
      />

      {/* SIDEBAR - GLASSMORPHISM */}
      <aside className="w-66 min-w-[260px] flex flex-col justify-between border-r border-white/5 bg-[#0d0b1f]/60 backdrop-blur-xl shadow-xl z-20">
        <div>
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/20">
                E
              </div>
              <span
                onClick={() => setCurrentView("hub")}
                className="font-black text-xl tracking-tight cursor-pointer text-white hover:opacity-80 transition-opacity"
              >
                Eugeen
              </span>
            </div>
          </div>

          <div className="px-4 py-6">
            <nav className="space-y-1">
              <button
                onClick={() => setCurrentView("hub")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${currentView === "hub" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "hover:bg-white/5 text-slate-400"}`}
              >
                📊 Dashboard Global
              </button>

              {/* EMPRESAS */}
              <div className="pt-6">
                <div className="px-4 flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    As Nossas Empresas
                  </p>
                  <button
                    onClick={() => handleAddNewEntity("empresa")}
                    className="text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer px-1"
                  >
                    ＋
                  </button>
                </div>
                <div className="space-y-1">
                  {brands
                    .filter((b) => b.type === "empresa")
                    .map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleOpenBrandPage(b.id)}
                        className={`entity-btn w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentView === "brand-view" && selectedBrandId === b.id ? "bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20" : "hover:bg-white/5 text-slate-400"}`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: b.color,
                              boxShadow: `0 0 8px ${b.color}`,
                            }}
                          ></span>
                          <span className="truncate">{b.name}</span>
                        </div>
                        <span
                          onClick={(e) => handleDeleteEntity(e, b.id, b.name)}
                          className="delete-btn text-xs text-slate-400 hover:text-rose-400 p-1"
                        >
                          🗑️
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* MARCAS */}
              <div className="pt-4">
                <div className="px-4 flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    As Nossas Marcas
                  </p>
                  <button
                    onClick={() => handleAddNewEntity("marca")}
                    className="text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer px-1"
                  >
                    ＋
                  </button>
                </div>
                <div className="space-y-1">
                  {brands
                    .filter((b) => b.type === "marca")
                    .map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleOpenBrandPage(b.id)}
                        className={`entity-btn w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentView === "brand-view" && selectedBrandId === b.id ? "bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20" : "hover:bg-white/5 text-slate-400"}`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: b.color,
                              boxShadow: `0 0 8px ${b.color}`,
                            }}
                          ></span>
                          <span className="truncate">{b.name}</span>
                        </div>
                        <span
                          onClick={(e) => handleDeleteEntity(e, b.id, b.name)}
                          className="delete-btn text-xs text-slate-400 hover:text-rose-400 p-1"
                        >
                          🗑️
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 flex flex-col gap-3 bg-black/20">
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="truncate text-slate-400 font-medium pr-2">
              {user?.email || "cardoso200614@gmail.com"}
            </span>
            <button
              onClick={onSignOut}
              className="text-slate-400 hover:text-rose-400 font-bold bg-transparent p-0 border-none cursor-pointer transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-[#0e0c24] to-[#06050f]">
        {currentView === "hub" && (
          <div className="flex flex-col h-full w-full overflow-y-auto">
            <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between shrink-0 bg-black/10 backdrop-blur-sm">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Hub de Arquivos Digitais
                </h1>
              </div>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-xl font-bold border border-indigo-500/20 shadow-sm">
                {files.length} Arquivos
              </span>
            </header>

            <div className="p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* GRÁFICO CIRCULAR */}
                <div className="p-6 rounded-2xl border border-white/5 bg-[#121026]/40 backdrop-blur-md shadow-xl flex flex-col items-center justify-center relative min-h-62.5">
                  <div className="flex items-center gap-8 w-full justify-center">
                    <div
                      className="w-32 h-32 rounded-full relative flex items-center justify-center shadow-lg"
                      style={{
                        backgroundImage: conicGradientValue || "none",
                        backgroundColor: "#1E293B",
                      }}
                    >
                      <div className="w-24 h-24 rounded-full flex flex-col items-center justify-center bg-[#0d0b1f]">
                        <span className="text-3xl font-black text-white">
                          {files.length}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      {brands.map((b) => (
                        <div key={b.id} className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor: b.color,
                              boxShadow: `0 0 6px ${b.color}`,
                            }}
                          ></span>
                          <span className="text-slate-300">{b.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CARTÕES DAS EMPRESAS COM EFEITO GLOW DINÂMICO */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {brands.map((b) => {
                    const count = files.filter(
                      (f) => f.brandId === b.id,
                    ).length;
                    return (
                      <div
                        key={b.id}
                        onClick={() => handleOpenBrandPage(b.id)}
                        style={{
                          borderColor: `${b.color}20`,
                        }}
                        className="p-6 rounded-2xl border bg-[#121026]/30 backdrop-blur-md shadow-md cursor-pointer hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = b.color;
                          e.currentTarget.style.boxShadow = `0 0 20px ${b.color}25`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = `${b.color}20`;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-white transition-colors">
                              {b.name}
                            </h3>
                            <div className="text-3xl font-black mt-2 text-white">
                              {count}
                            </div>
                          </div>
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                            style={{
                              backgroundColor: `${b.color}15`,
                              color: b.color,
                            }}
                          >
                            📂
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 mt-4 flex items-center gap-1.5">
                          Ver arquivos organizados{" "}
                          <span style={{ color: b.color }}>→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVIDADE RECENTE - GLASSMORPHISM */}
              <div className="p-6 rounded-2xl border border-white/5 bg-[#121026]/20 backdrop-blur-md shadow-xl">
                <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                  <span>⏱️</span> Atividade Recente
                </h2>
                <div className="divide-y divide-white/5">
                  {activities.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4">
                      Nenhuma atividade registada até ao momento.
                    </p>
                  ) : (
                    activities.map((act) => (
                      <div
                        key={act.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                      >
                        <div className="text-slate-300">
                          <span className="font-bold text-indigo-400">
                            {act.user}
                          </span>{" "}
                          {act.action === "eliminou" ? (
                            <span className="text-rose-400 font-medium">
                              eliminou
                            </span>
                          ) : act.action === "eliminou_pasta" ? (
                            <span className="text-rose-400 font-medium">
                              eliminou a pasta
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-medium">
                              adicionou
                            </span>
                          )}{" "}
                          <span className="font-semibold text-white">
                            {act.fileName || act.folderName}
                          </span>{" "}
                          em{" "}
                          <span className="text-slate-400">
                            /{act.folderName || ""}
                          </span>{" "}
                          dentro de{" "}
                          <span className="px-2 py-0.5 rounded bg-white/5 text-xs font-medium text-slate-300">
                            {act.brandName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 shrink-0">
                          {act.time}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CÓDIGO DA BRAND VIEW (MANTIDO E ADAPTADO PARA MODO ESCURO FIXO) */}
        {currentView === "brand-view" && activeBrand && (
          <div className="flex flex-col h-full w-full">
            <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between shrink-0 bg-black/10 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView("hub")}
                  className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  ⬅ Voltar ao Hub
                </button>
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: activeBrand.color,
                      boxShadow: `0 0 10px ${activeBrand.color}`,
                    }}
                  ></span>
                  <h1 className="text-xl font-black text-white">
                    {activeBrand.name}
                  </h1>
                </div>
              </div>
              <button
                onClick={handleAddFolder}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                ＋ Criar Nova Pasta
              </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* LISTA DE PASTAS INTERNAS */}
              <div className="w-64 border-r border-white/5 bg-black/10 flex flex-col p-4 gap-1 overflow-y-auto">
                <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Pastas Disponíveis
                </p>
                {activeBrand.folders.map((pasta) => (
                  <div
                    key={pasta}
                    onClick={() => setSelectedFolderName(pasta)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${selectedFolderName === pasta ? "bg-white/5 text-white font-bold border border-white/10" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
                  >
                    <span className="truncate">📁 {pasta}</span>
                    <button
                      onClick={(e) => handleEliminarFolder(e, pasta)}
                      className="text-xs text-slate-500 hover:text-rose-400 p-1 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              {/* LISTA DE ARQUIVOS */}
              <div className="flex-1 p-8 overflow-y-auto flex flex-col">
                {selectedFolderName ? (
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                      <div>
                        <h2 className="text-lg font-black text-white">
                          Conteúdo de:{" "}
                          <span className="text-indigo-400">
                            /{selectedFolderName}
                          </span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {currentFiles.length} ficheiros guardados em nuvem.
                        </p>
                      </div>

                      <button
                        onClick={triggerFileSelection}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/10 transition-all flex items-center gap-2"
                      >
                        📤 Carregar Arquivo
                      </button>
                    </div>

                    {loadingFiles ? (
                      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                        A atualizar lista de arquivos...
                      </div>
                    ) : currentFiles.length === 0 ? (
                      <div className="flex-1 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-black/5">
                        <span className="text-3xl mb-2">📦</span>
                        <p className="text-sm text-slate-400 font-semibold">
                          Esta pasta está vazia
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Carrega o teu primeiro documento ou elemento
                          multimédia aqui em cima.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {currentFiles.map((file) => (
                          <div
                            key={file.id}
                            className="p-4 rounded-xl border border-white/5 bg-[#121026]/20 hover:bg-[#121026]/40 transition-all flex flex-col justify-between group"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl mt-1 shrink-0">📄</span>
                              <div className="truncate flex-1">
                                <h4
                                  className="text-sm font-bold text-white truncate"
                                  title={file.fileName}
                                >
                                  {file.fileName}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {file.size}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all"
                              >
                                🔗 Abrir
                              </a>
                              <button
                                onClick={() => handleMoverFile(file.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-[11px] font-bold text-indigo-400 transition-all"
                              >
                                📦 Mover
                              </button>
                              <button
                                onClick={() =>
                                  handleEliminarFile(file.id, file.fileName)
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-[11px] font-bold text-rose-400 transition-all"
                              >
                                🗑️ Apagar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <p className="text-sm font-medium">
                      Por favor, seleciona ou cria uma pasta na barra lateral.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
