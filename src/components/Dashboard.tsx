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
import BackgroundWaves from "./BackgroundWaves";

// Mapa de IDs estáticos conhecidos na Base de Dados
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
  // Estado para controlar o Light/Dark mode
  const [lightMode, setLightMode] = useState<boolean>(false);

  const [brands, setBrands] = useState<Brand[]>(() => {
    const dadosGuardados = localStorage.getItem("eugeen_brands");
    if (dadosGuardados) {
      try {
        return JSON.parse(dadosGuardados);
      } catch (e) {
        console.error("Erro ao carregar marcas do localStorage", e);
      }
    }
    return [
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
        type: "empresa",
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
    ];
  });

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

  // Efeito para alternar a classe no HTML para o Light Mode funcionar
  useEffect(() => {
    if (lightMode) {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [lightMode]);

  const getTargetUuid = (id: string): string => {
    if (id.startsWith("factor")) return BRAND_UUID_MAP["factor"];
    if (id.startsWith("nomad")) return BRAND_UUID_MAP["nomad"];
    if (id.startsWith("communities")) return BRAND_UUID_MAP["communities"];
    if (id.startsWith("sinfon")) return BRAND_UUID_MAP["sinfon"];

    return BRAND_UUID_MAP[id] || id;
  };

  useEffect(() => {
    localStorage.setItem("eugeen_brands", JSON.stringify(brands));
  }, [brands]);

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

    const generatedUuid = crypto.randomUUID
      ? crypto.randomUUID()
      : "00000000-0000-4000-a000-" +
        Date.now().toString().padEnd(12, "0").slice(0, 12);

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
      id: generatedUuid,
      name: entityName.trim(),
      slug: slug,
      type: type,
      color: randomColor,
      folders: ["Logos", "Vídeos"],
    };

    setBrands((prev) => [...prev, newEntity]);

    Swal.fire({
      title: "Adicionado!",
      text: `A estrutura para "${entityName.trim()}" foi criada com sucesso com UUID válido.`,
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
          const staticKey = Object.keys(BRAND_UUID_MAP).find(
            (key) => BRAND_UUID_MAP[key] === dbUuid,
          );
          if (staticKey) {
            const match = brands.find(
              (b) => b.id === staticKey || b.id.startsWith(staticKey),
            );
            return match ? match.id : staticKey;
          }
          return dbUuid;
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
      const targetUuid = getTargetUuid(selectedBrandId);

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
      const targetUuid = getTargetUuid(destinoId);

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
    if (!selectedBrandId) return;

    const targetUuid = getTargetUuid(selectedBrandId);
    const filesArray = Array.from(selectedFiles);

    // Alerta inicial do progresso geral dos uploads múltiplos
    Swal.fire({
      title: "A carregar ficheiros...",
      text: `A processar 1 de ${filesArray.length} ficheiros. Por favor aguarde.`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: "#1E293B",
      color: "#FFFFFF",
    });

    try {
      for (let i = 0; i < filesArray.length; i++) {
        const uploadedFile = filesArray[i];

        // Atualiza a mensagem da modal para indicar qual o ficheiro a ser processado
        if (filesArray.length > 1) {
          Swal.update({
            text: `A processar ${i + 1} de ${filesArray.length} (${uploadedFile.name})...`,
          });
        }

        const fileExtension = uploadedFile.name.split(".").pop() || "";
        const cleanName = uploadedFile.name
          .replace(`.${fileExtension}`, "")
          .replace(/[^a-zA-Z0-9]/g, "_");

        const storagePath = `${selectedBrandId}/${selectedFolderName}/${Date.now()}_${cleanName}.${fileExtension}`;

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
              id: `act-${Date.now()}-${i}`,
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
      }

      // Sucesso final após carregar o array completo
      Swal.fire({
        title: "Sucesso!",
        text:
          filesArray.length === 1
            ? "O ficheiro foi carregado corretamente."
            : `Todos os ${filesArray.length} ficheiros foram carregados com sucesso.`,
        icon: "success",
        confirmButtonColor: "#6366F1",
        background: "#1E293B",
        color: "#FFFFFF",
      });
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        title: "Erro no envio",
        text: `Ocorreu um problema ao enviar os ficheiros: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#EF4444",
        background: "#1E293B",
        color: "#FFFFFF",
      });
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
        multiple
      />

      {/* SIDEBAR */}
      <aside
        className={`w-66 min-w-[260px] flex flex-col justify-between border-r backdrop-blur-xl shadow-xl z-20 transition-all duration-300 ${
          lightMode
            ? "bg-white border-slate-200 text-slate-900"
            : "bg-[#0d0b1f]/60 border-white/5 text-white"
        }`}
      >
        <div>
          <div
            className={`p-6 border-b transition-colors duration-300 ${
              lightMode ? "border-slate-200 bg-white" : "border-white/5"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/20">
                  E
                </div>
                <span
                  onClick={() => setCurrentView("hub")}
                  className={`font-black text-xl tracking-tight cursor-pointer hover:opacity-80 transition-opacity ${
                    lightMode ? "text-slate-900" : "text-white"
                  }`}
                >
                  Eugeen
                </span>
              </div>

              {/* BOTÃO DO LIGHT MODE - Ícones Corrigidos */}
              <button
                onClick={() => setLightMode(!lightMode)}
                className={`p-2 rounded-lg transition-all hover:scale-105 ${
                  lightMode
                    ? "bg-slate-100 hover:bg-slate-200 text-amber-600"
                    : "bg-white/5 hover:bg-white/10 text-amber-400"
                }`}
                title={
                  lightMode ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"
                }
              >
                {lightMode ? (
                  /* Em Modo Claro, mostra a Lua para mudar para o Escuro */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                    />
                  </svg>
                ) : (
                  /* Em Modo Escuro, mostra o Sol para mudar para o Claro */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v2.25m0 13.5V21M4.22 4.22l1.59 1.59m12.38 12.38l1.59 1.59M21 12h-2.25m-13.5 0H3m22.38-7.78l-1.59 1.59M6.06 17.94l-1.59 1.59M12 6.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div
            className={`px-4 py-6 transition-colors duration-300 ${lightMode ? "bg-white" : ""}`}
          >
            <nav className="space-y-1">
              <button
                onClick={() => setCurrentView("hub")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  currentView === "hub"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : lightMode
                      ? "hover:bg-slate-100 text-slate-700"
                      : "hover:bg-white/5 text-slate-400"
                }`}
              >
                📊 Dashboard Global
              </button>

              {/* EMPRESAS */}
              <div className="pt-6">
                <div className="px-4 flex items-center justify-between mb-3">
                  <p
                    className={`text-[11px] font-bold uppercase tracking-widest ${lightMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    As Nossas Empresas
                  </p>
                  <button
                    onClick={() => handleAddNewEntity("empresa")}
                    className={`text-xs font-bold transition-colors cursor-pointer px-1 ${lightMode ? "text-slate-400 hover:text-indigo-600" : "text-slate-400 hover:text-indigo-400"}`}
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
                        className={`entity-btn w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          currentView === "brand-view" &&
                          selectedBrandId === b.id
                            ? lightMode
                              ? "bg-indigo-50 text-indigo-600 font-bold border border-indigo-200"
                              : "bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20"
                            : lightMode
                              ? "hover:bg-slate-50 text-slate-600"
                              : "hover:bg-white/5 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: b.color,
                              boxShadow: lightMode
                                ? `0 0 6px ${b.color}80`
                                : `0 0 8px ${b.color}`,
                            }}
                          ></span>
                          <span className="truncate">{b.name}</span>
                        </div>
                        <span
                          onClick={(e) => handleDeleteEntity(e, b.id, b.name)}
                          className={`delete-btn text-xs p-1 transition-colors ${lightMode ? "text-slate-400 hover:text-rose-600" : "text-slate-400 hover:text-rose-400"}`}
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
                  <p
                    className={`text-[11px] font-bold uppercase tracking-widest ${lightMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    As Nossas Marcas
                  </p>
                  <button
                    onClick={() => handleAddNewEntity("marca")}
                    className={`text-xs font-bold transition-colors cursor-pointer px-1 ${lightMode ? "text-slate-400 hover:text-indigo-600" : "text-slate-400 hover:text-indigo-400"}`}
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
                        className={`entity-btn w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          currentView === "brand-view" &&
                          selectedBrandId === b.id
                            ? lightMode
                              ? "bg-indigo-50 text-indigo-600 font-bold border border-indigo-200"
                              : "bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20"
                            : lightMode
                              ? "hover:bg-slate-50 text-slate-600"
                              : "hover:bg-white/5 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: b.color,
                              boxShadow: lightMode
                                ? `0 0 6px ${b.color}80`
                                : `0 0 8px ${b.color}`,
                            }}
                          ></span>
                          <span className="truncate">{b.name}</span>
                        </div>
                        <span
                          onClick={(e) => handleDeleteEntity(e, b.id, b.name)}
                          className={`delete-btn text-xs p-1 transition-colors ${lightMode ? "text-slate-400 hover:text-rose-600" : "text-slate-400 hover:text-rose-400"}`}
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

        <div
          className={`p-4 border-t flex flex-col gap-3 transition-colors duration-300 ${lightMode ? "border-slate-200 bg-slate-50" : "border-white/5 bg-black/20"}`}
        >
          <div className="flex items-center justify-between text-xs pt-1">
            <span
              className={`truncate font-medium pr-2 ${lightMode ? "text-slate-600" : "text-slate-400"}`}
            >
              {user?.email || "cardoso200614@gmail.com"}
            </span>
            <button
              onClick={onSignOut}
              className={`font-bold bg-transparent p-0 border-none cursor-pointer transition-colors ${lightMode ? "text-slate-500 hover:text-rose-600" : "text-slate-400 hover:text-rose-400"}`}
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT - Correção do fundo escuro geral */}
      <main
        className={`flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 ${
          lightMode
            ? "bg-slate-50"
            : "bg-gradient-to-b from-[#0e0c24] to-[#06050f]"
        }`}
      >
        {/* Desativa completamente as ondas de fundo no Light Mode */}
        {!lightMode && <BackgroundWaves />}

        {/* VISTA 1: HUB GLOBAL */}
        {currentView === "hub" && (
          <div className="flex flex-col h-full w-full overflow-y-auto relative z-10">
            <header
              className={`h-20 border-b px-8 flex items-center justify-between shrink-0 backdrop-blur-sm transition-colors duration-300 ${
                lightMode
                  ? "border-slate-200 bg-white"
                  : "border-white/5 bg-black/10"
              }`}
            >
              <div>
                <h1
                  className={`text-2xl font-black tracking-tight transition-colors ${lightMode ? "text-slate-800" : "text-white"}`}
                >
                  Hub de Arquivos Digitais
                </h1>
              </div>
              <span
                className={`text-xs px-3 py-1.5 rounded-xl font-bold border shadow-sm transition-all ${
                  lightMode
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                }`}
              >
                {files.length} Arquivos
              </span>
            </header>

            <div className="p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* GRÁFICO CIRCULAR */}
                <div
                  className={`p-6 rounded-2xl border backdrop-blur-md shadow-xl flex flex-col items-center justify-center relative min-h-62.5 transition-colors duration-300 ${
                    lightMode
                      ? "border-slate-200 bg-white shadow-slate-200/20"
                      : "border-white/5 bg-[#121026]/40"
                  }`}
                >
                  <div className="flex items-center gap-8 w-full justify-center">
                    <div
                      className="w-32 h-32 rounded-full relative flex items-center justify-center shadow-lg"
                      style={{
                        backgroundImage: conicGradientValue || "none",
                        backgroundColor: lightMode ? "#F1F5F9" : "#1E293B",
                      }}
                    >
                      <div
                        className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-colors duration-300 ${
                          lightMode ? "bg-white" : "bg-[#0d0b1f]"
                        }`}
                      >
                        <span
                          className={`text-3xl font-black transition-colors ${lightMode ? "text-slate-800" : "text-white"}`}
                        >
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
                              boxShadow: lightMode
                                ? `0 0 4px ${b.color}60`
                                : `0 0 6px ${b.color}`,
                            }}
                          ></span>
                          <span
                            className={
                              lightMode
                                ? "text-slate-600 font-semibold"
                                : "text-slate-300"
                            }
                          >
                            {b.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CARTÕES DAS EMPRESAS */}
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
                          borderColor: lightMode ? `#E2E8F0` : `${b.color}20`,
                        }}
                        className={`p-6 rounded-2xl border backdrop-blur-md shadow-md cursor-pointer hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${
                          lightMode
                            ? "bg-white shadow-slate-100"
                            : "bg-[#121026]/30"
                        }`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = b.color;
                          e.currentTarget.style.boxShadow = lightMode
                            ? `0 10px 25px ${b.color}15`
                            : `0 0 20px ${b.color}25`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = lightMode
                            ? `#E2E8F0`
                            : `${b.color}20`;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3
                              className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                                lightMode
                                  ? "text-slate-400 group-hover:text-slate-700"
                                  : "text-slate-400 group-hover:text-white"
                              }`}
                            >
                              {b.name}
                            </h3>
                            <div
                              className={`text-3xl font-black mt-2 transition-colors ${lightMode ? "text-slate-800" : "text-white"}`}
                            >
                              {count}
                            </div>
                          </div>
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
                            style={{
                              backgroundColor: `${b.color}15`,
                              color: b.color,
                            }}
                          >
                            📁
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ATIVIDADE RECENTE - Corrigido para fundo branco/claro */}
              <div
                className={`p-6 rounded-2xl border shadow-md transition-colors duration-300 ${
                  lightMode
                    ? "border-slate-200 bg-white"
                    : "border-white/5 bg-[#121026]/20"
                }`}
              >
                <h2
                  className={`text-lg font-black mb-4 transition-colors ${lightMode ? "text-slate-800" : "text-white"}`}
                >
                  Atividade Recente no Servidor
                </h2>
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">
                      Nenhuma atividade recente detetada.
                    </p>
                  ) : (
                    activities.map((act) => (
                      <div
                        key={act.id}
                        className={`flex items-center justify-between text-sm p-3 rounded-xl border backdrop-blur-sm transition-colors duration-300 ${
                          lightMode
                            ? "bg-slate-50 border-slate-150"
                            : "bg-white/5 border-white/5"
                        }`}
                      >
                        <div>
                          <span
                            className={`font-bold ${lightMode ? "text-slate-800" : "text-slate-300"}`}
                          >
                            {act.user}
                          </span>{" "}
                          <span
                            className={
                              lightMode ? "text-slate-500" : "text-slate-400"
                            }
                          >
                            {act.action}
                          </span>{" "}
                          <span
                            className={`font-semibold ${lightMode ? "text-indigo-600" : "text-indigo-400"}`}
                          >
                            {act.fileName || act.folderName}
                          </span>{" "}
                          <span
                            className={
                              lightMode ? "text-slate-400" : "text-slate-500"
                            }
                          >
                            em {act.brandName}
                          </span>
                        </div>
                        <span
                          className={
                            lightMode
                              ? "text-slate-400 text-xs"
                              : "text-slate-500 text-xs"
                          }
                        >
                          {act.time}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 2: PASTA ESPECÍFICA */}
        {currentView === "brand-view" && activeBrand && (
          <div className="flex flex-col h-full w-full overflow-hidden relative z-10">
            <header
              className={`h-20 border-b px-8 flex items-center justify-between shrink-0 backdrop-blur-sm transition-colors duration-300 ${
                lightMode
                  ? "border-slate-200 bg-white"
                  : "border-white/5 bg-black/10"
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView("hub")}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    lightMode
                      ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                      : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  ⬅ Voltar ao Hub
                </button>
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: activeBrand.color,
                      boxShadow: lightMode
                        ? `0 0 6px ${activeBrand.color}80`
                        : `0 0 10px ${activeBrand.color}`,
                    }}
                  ></span>
                  <h1
                    className={`text-xl font-black tracking-tight transition-colors ${lightMode ? "text-slate-800" : "text-white"}`}
                  >
                    {activeBrand.name}
                  </h1>
                </div>
              </div>

              <button
                onClick={triggerFileSelection}
                className="px-5 py-2.5 text-xs font-bold rounded-xl text-white transition-all shadow-lg shadow-indigo-600/20 cursor-pointer hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${activeBrand.color}, #6366F1)`,
                }}
              >
                📥 Carregar Arquivo
              </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* SUB-SIDEBAR DE PASTAS */}
              <div
                className={`w-56 border-r p-4 space-y-4 flex flex-col justify-between shrink-0 backdrop-blur-md transition-colors duration-300 ${
                  lightMode
                    ? "border-slate-200 bg-white"
                    : "border-white/5 bg-black/10"
                }`}
              >
                <div className="space-y-1">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest px-3 mb-2 ${lightMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Pastas Internas
                  </p>
                  {activeBrand.folders.map((folder) => (
                    <div
                      key={folder}
                      onClick={() => setSelectedFolderName(folder)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all group/folder ${
                        selectedFolderName === folder
                          ? lightMode
                            ? "bg-slate-100 text-slate-900 font-bold border border-slate-200 shadow-sm"
                            : "bg-white/5 text-white font-bold border border-white/10"
                          : lightMode
                            ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <span className="truncate">📁 {folder}</span>
                      <button
                        onClick={(e) => handleEliminarFolder(e, folder)}
                        className={`opacity-0 group-hover/folder:opacity-100 p-0.5 transition-opacity ${lightMode ? "text-slate-400 hover:text-rose-600" : "text-slate-500 hover:text-rose-400"}`}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddFolder}
                  className={`w-full py-2.5 text-center text-xs font-bold rounded-xl border border-dashed transition-all cursor-pointer ${
                    lightMode
                      ? "border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400"
                      : "border-white/10 text-slate-400 hover:text-white hover:border-white/30"
                  }`}
                >
                  ＋ Criar Nova Pasta
                </button>
              </div>

              {/* LISTAGEM DE ARQUIVOS */}
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="mb-6 flex items-center justify-between">
                  <h2
                    className={`text-sm font-bold uppercase tracking-wider ${lightMode ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Ficheiros em /
                    <span
                      className={`ml-1 normal-case ${lightMode ? "text-slate-700 font-black" : "text-slate-200"}`}
                    >
                      {selectedFolderName || "Nenhuma pasta selecionada"}
                    </span>
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    {currentFiles.length} itens encontrados
                  </span>
                </div>

                {loadingFiles ? (
                  <div className="text-center py-20 text-slate-500 text-sm">
                    A carregar ficheiros...
                  </div>
                ) : currentFiles.length === 0 ? (
                  <div
                    className={`flex flex-col items-center justify-center border border-dashed rounded-2xl py-24 text-slate-500 text-sm backdrop-blur-sm transition-colors duration-300 ${
                      lightMode
                        ? "border-slate-200 bg-white"
                        : "border-white/5 bg-black/5"
                    }`}
                  >
                    <span className="text-3xl mb-2">📁</span>
                    <span>
                      Esta pasta está vazia. Carrega ficheiros para começar.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {currentFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`p-4 rounded-xl border backdrop-blur-sm flex flex-col justify-between group/file transition-all duration-300 ${
                          lightMode
                            ? "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md"
                            : "border-white/5 bg-[#121026]/20 hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${lightMode ? "bg-slate-50" : "bg-white/5"}`}
                          >
                            📄
                          </div>
                          <div className="truncate min-w-0 flex-1">
                            <h4
                              className={`text-xs font-bold truncate transition-colors ${lightMode ? "text-slate-700" : "text-slate-200"}`}
                              title={file.fileName}
                            >
                              {file.fileName}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {file.size}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`flex items-center justify-end gap-2 mt-4 pt-3 border-t ${lightMode ? "border-slate-100" : "border-white/5"}`}
                        >
                          <button
                            onClick={() => handleMoverFile(file.id)}
                            className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                              lightMode
                                ? "bg-slate-50 border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                                : "bg-white/5 border-white/5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/5"
                            }`}
                          >
                            📦 Mover
                          </button>
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all text-center cursor-pointer ${
                              lightMode
                                ? "bg-slate-50 border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                                : "bg-white/5 border-white/5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5"
                            }`}
                          >
                            🔗 Ver
                          </a>
                          <button
                            onClick={() =>
                              handleEliminarFile(file.id, file.fileName)
                            }
                            className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                              lightMode
                                ? "bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                : "bg-white/5 border-white/5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5"
                            }`}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
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
