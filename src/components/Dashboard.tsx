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
  const [mounted, setMounted] = useState(false);
  const [lightMode, setLightMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("eugeen_light_mode");
    const initial = saved === "true";
    const domHasLight =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("light");
    console.log("[THEME][2-react-init]", {
      saved,
      reactInitial: initial ? "LIGHT" : "DARK",
      domAlreadyPainted: domHasLight ? "LIGHT" : "DARK",
      mismatch: (domHasLight ? "LIGHT" : "DARK") !== (initial ? "LIGHT" : "DARK"),
      t: performance.now().toFixed(1) + "ms",
    });
    return initial;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (typeof document === "undefined") return;

    const before = document.documentElement.classList.contains("light")
      ? "LIGHT"
      : "DARK";
    document.documentElement.classList.toggle("light", lightMode);
    document.documentElement.classList.toggle("dark", !lightMode);
    localStorage.setItem("eugeen_light_mode", String(lightMode));
    const after = lightMode ? "LIGHT" : "DARK";
    console.log("[THEME][3-react-effect]", {
      before,
      after,
      flipped: before !== after ? "⚠️ FLASH (cambió tras pintar)" : "ok (sin cambio)",
      t: performance.now().toFixed(1) + "ms",
    });
  }, [lightMode]);

  const toggleLightMode = () => {
    setLightMode((prev) => !prev);
  };

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
      cancelButtonColor: lightMode ? "#cbd5e1" : "#475569",
      background: lightMode ? "#ffffff" : "#1E293B",
      color: lightMode ? "#0f172a" : "#FFFFFF",
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
      background: lightMode ? "#ffffff" : "#1E293B",
      color: lightMode ? "#0f172a" : "#FFFFFF",
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
      cancelButtonColor: lightMode ? "#cbd5e1" : "#475569",
      background: lightMode ? "#ffffff" : "#1E293B",
      color: lightMode ? "#0f172a" : "#FFFFFF",
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
      background: lightMode ? "#ffffff" : "#1E293B",
      color: lightMode ? "#0f172a" : "#FFFFFF",
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
        background: lightMode ? "#ffffff" : "#1E293B",
        color: lightMode ? "#0f172a" : "#FFFFFF",
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
      cancelButtonColor: lightMode ? "#cbd5e1" : "#475569",
      background: lightMode ? "#ffffff" : "#1E293B",
      color: lightMode ? "#0f172a" : "#FFFFFF",
    });

    if (!destinoId) return;

    const alvo = brands.find((b) => b.id === destinoId);

    if (!alvo || alvo.folders.length === 0) {
      Swal.fire({
        title: "Aviso",
        text: "O destino selecionado não possui nenhuma pasta criada para receber ficheiros.",
        icon: "warning",
        confirmButtonColor: "#6366F1",
        background: lightMode ? "#ffffff" : "#1E293B",
        color: lightMode ? "#0f172a" : "#FFFFFF",
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
      cancelButtonColor: lightMode ? "#cbd5e1" : "#475569",
      background: lightMode ? "#ffffff" : "#1E293B",
      color: lightMode ? "#0f172a" : "#FFFFFF",
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
        background: lightMode ? "#ffffff" : "#1E293B",
        color: lightMode ? "#0f172a" : "#FFFFFF",
      });
    } catch (error: any) {
      console.error("Erro ao mover ficheiro:", error.message);
      Swal.fire({
        title: "Erro na operação",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#EF4444",
        background: lightMode ? "#ffffff" : "#1E293B",
        color: lightMode ? "#0f172a" : "#FFFFFF",
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

    Swal.fire({
      title: "A carregar ficheiros...",
      text: `A processar 1 de ${filesArray.length} ficheiros. Por favor aguarde.`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: lightMode ? "#ffffff" : "#1E293B",
      color: lightMode ? "#0f172a" : "#FFFFFF",
    });

    try {
      for (let i = 0; i < filesArray.length; i++) {
        const uploadedFile = filesArray[i];

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

      Swal.fire({
        title: "Sucesso!",
        text:
          filesArray.length === 1
            ? "O ficheiro foi carregado corretamente."
            : `Todos os ${filesArray.length} ficheiros foram carregados com sucesso.`,
        icon: "success",
        confirmButtonColor: "#6366F1",
        background: lightMode ? "#ffffff" : "#1E293B",
        color: lightMode ? "#0f172a" : "#FFFFFF",
      });
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        title: "Erro no envio",
        text: `Ocorreu um problema ao enviar os ficheiros: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#EF4444",
        background: lightMode ? "#ffffff" : "#1E293B",
        color: lightMode ? "#0f172a" : "#FFFFFF",
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
    <div className={`flex h-screen w-full font-sans antialiased overflow-hidden transition-colors duration-300 ${
      lightMode ? "bg-slate-50 text-slate-900" : "bg-[#0A0915] text-slate-200"
    }`}>
      <style>{`
        .swal2-select, .swal2-input {
          background-color: ${lightMode ? '#f1f5f9' : '#1E293B'} !important;
          color: ${lightMode ? '#0f172a' : '#FFFFFF'} !important;
          border: 1px solid ${lightMode ? '#cbd5e1' : '#475569'} !important;
          border-radius: 12px !important;
          padding: 10px !important;
        }
        .swal2-popup {
          border-radius: 24px !important;
          font-family: sans-serif !important;
          background-color: ${lightMode ? '#ffffff' : '#1E293B'} !important;
          color: ${lightMode ? '#0f172a' : '#FFFFFF'} !important;
        }
        .swal2-title {
          color: ${lightMode ? '#0f172a' : '#FFFFFF'} !important;
        }
        .swal2-html-container {
          color: ${lightMode ? '#475569' : '#cbd5e1'} !important;
        }
        .swal2-confirm {
          background: linear-gradient(to right, #6366f1, #8b5cf6) !important;
        }
        .swal2-cancel {
          background-color: ${lightMode ? '#e2e8f0' : '#475569'} !important;
          color: ${lightMode ? '#0f172a' : '#ffffff'} !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${lightMode ? 'rgba(148, 163, 184, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${lightMode ? 'rgba(148, 163, 184, 0.7)' : 'rgba(255, 255, 255, 0.2)'};
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${lightMode ? '#cbd5e1' : '#1E293B'};
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
                          ✕
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* MARCAS */}
              <div className="pt-6">
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
                          ✕
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </nav>
          </div>
        </div>

        {/* FOOTER SIDEBAR */}
        <div
          className={`p-4 border-t transition-colors duration-300 ${
            lightMode ? "border-slate-200 bg-slate-50 text-slate-700" : "border-white/5 bg-[#070514]/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 max-w-[150px]">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                👤
              </div>
              <div className="truncate">
                <p
                  className={`text-xs font-semibold truncate ${lightMode ? "text-slate-800" : "text-white"}`}
                >
                  {user?.email || "Visitante"}
                </p>
                <p className="text-[10px] text-slate-500">Acesso total</p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className={`p-2 rounded-lg transition-colors ${
                lightMode
                  ? "hover:bg-rose-50 text-rose-600"
                  : "hover:bg-rose-500/10 text-rose-400"
              }`}
              title="Sair da Conta"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 relative flex flex-col overflow-hidden z-10">

        {currentView === "hub" ? (
          /* ==========================================
             VISUALIZAÇÃO DO HUB PRINCIPAL (DASHBOARD GLOBAL)
             ========================================== */
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 relative z-10 space-y-8">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className={`text-3xl font-black tracking-tight ${lightMode ? "text-slate-900" : "text-white"}`}
                >
                  Painel Central de Ativos
                </h1>
                <p
                  className={`text-sm mt-1 ${lightMode ? "text-slate-500" : "text-slate-400"}`}
                >
                  Gestão global unificada de marcas, empresas e repositórios da
                  Eugeen.
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-md shadow-sm border ${
                  lightMode
                    ? "bg-white/80 border-slate-200 text-slate-700"
                    : "bg-white/5 border-white/5 text-slate-300"
                }`}
              >
                📁 {files.length} ficheiros indexados
              </div>
            </div>

            {/* Widgets e Estatísticas Superiores */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Gráfico Analítico de Armazenamento */}
              <div
                className={`p-6 rounded-3xl border shadow-xl flex items-center gap-6 xl:col-span-2 backdrop-blur-md transition-all duration-300 ${
                  lightMode
                    ? "bg-white border-slate-200 text-slate-800"
                    : "bg-[#0d0b1f]/40 border-white/5"
                }`}
              >
                <div className={`relative w-28 h-28 shrink-0 rounded-full flex items-center justify-center p-1 shadow-inner ${
                  lightMode ? "bg-slate-200/50" : "bg-slate-950/20"
                }`}>
                  <div
                    className="absolute inset-0 rounded-full opacity-80"
                    style={{ backgroundImage: conicGradientValue }}
                  />
                  <div
                    className={`w-22 h-22 rounded-full flex flex-col items-center justify-center z-10 shadow-lg ${
                      lightMode ? "bg-white" : "bg-[#0c0a1a]"
                    }`}
                  >
                    <span
                      className={`text-xl font-black ${lightMode ? "text-slate-900" : "text-white"}`}
                    >
                      {brands.length}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Entidades
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h3
                      className={`text-base font-bold ${lightMode ? "text-slate-900" : "text-white"}`}
                    >
                      Distribuição Operacional
                    </h3>
                    <p className="text-xs text-slate-500">
                      O rácio proporcional de arquivos alocados em cada infraestrutura
                      do ecossistema.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {brands.map((b) => {
                      const count = files.filter((f) => f.brandId === b.id).length;
                      return (
                        <div
                          key={b.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: b.color }}
                          ></span>
                          <span
                            className={`font-medium ${lightMode ? "text-slate-700" : "text-slate-300"}`}
                          >
                            {b.name}
                          </span>
                          <span className="text-slate-500 font-mono">
                            ({count})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bloco de Atividade de Upload Recente */}
              <div
                className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between backdrop-blur-md transition-all duration-300 ${
                  lightMode
                    ? "bg-white border-slate-200 text-slate-800"
                    : "bg-[#0d0b1f]/40 border-white/5"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3
                      className={`text-sm font-bold uppercase tracking-wider ${lightMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Atividade do Servidor
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    {activities.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">
                        Nenhum upload ou alteração efetuada recentemente.
                      </p>
                    ) : (
                      activities.map((act) => (
                        <div key={act.id} className="text-xs leading-relaxed">
                          <span
                            className={`font-semibold ${lightMode ? "text-slate-800" : "text-slate-300"}`}
                          >
                            {act.user}
                          </span>{" "}
                          <span className="text-slate-500">
                            {act.action === "eliminou"
                              ? "removeu"
                              : act.action === "eliminou_pasta"
                                ? "eliminou a pasta"
                                : "adicionou"}
                          </span>{" "}
                          <span
                            className={`font-medium ${lightMode ? "text-indigo-600" : "text-indigo-400"}`}
                          >
                            {act.action === "eliminou_pasta"
                              ? act.folderName
                              : act.fileName || act.folderName}
                          </span>{" "}
                          <span className="text-slate-500">em</span>{" "}
                          <span
                            className={`font-semibold ${lightMode ? "text-slate-700" : "text-slate-400"}`}
                          >
                            {act.brandName}
                          </span>
                          <p className="text-[10px] text-slate-500 tracking-wide mt-0.5">
                            {act.time}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SEPARAÇÃO POR CATEGORIAS (SECÇÕES CLARAS) */}
            <div className="space-y-8">
              {/* SECÇÃO SUPERIOR: EMPRESAS */}
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h2
                    className={`text-lg font-bold uppercase tracking-wider ${
                      lightMode ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    Empresas
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {brands
                    .filter((b) => b.type === "empresa")
                    .map((b) => {
                      const countFiles = files.filter(
                        (f) => f.brandId === b.id,
                      ).length;
                      return (
                        <div
                          key={b.id}
                          onClick={() => handleOpenBrandPage(b.id)}
                          className={`group p-6 rounded-2xl border transition-all duration-300 cursor-pointer hover:-translate-y-1 relative backdrop-blur-md shadow-md ${
                            lightMode
                              ? "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xl text-slate-800"
                              : "bg-[#0d0b1f]/30 border-white/5 hover:border-white/10 hover:bg-[#12102b]/50 hover:shadow-2xl hover:shadow-purple-950/10"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span
                              className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm"
                              style={{
                                backgroundColor: `${b.color}15`,
                                color: b.color,
                                border: `1px solid ${b.color}30`,
                              }}
                            >
                              {b.type}
                            </span>
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all text-base ${
                                lightMode
                                  ? "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                  : "bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-slate-300"
                              }`}
                            >
                              📁
                            </div>
                          </div>

                          <h2
                            className={`text-xl font-bold tracking-tight group-hover:text-indigo-400 transition-colors ${
                              lightMode ? "text-slate-900" : "text-white"
                            }`}
                          >
                            {b.name}
                          </h2>

                          <div className="mt-4 flex items-baseline gap-1.5 text-slate-500">
                            <span
                              className={`text-2xl font-black ${
                                lightMode ? "text-slate-800" : "text-white"
                              }`}
                            >
                              {countFiles}
                            </span>
                            <span className="text-xs font-medium">
                              ficheiros guardados
                            </span>
                          </div>

                          <div
                            className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl opacity-40 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: b.color }}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* SECÇÃO INFERIOR: MARCAS */}
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h2
                    className={`text-lg font-bold uppercase tracking-wider ${
                      lightMode ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    Marcas
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {brands
                    .filter((b) => b.type === "marca")
                    .map((b) => {
                      const countFiles = files.filter(
                        (f) => f.brandId === b.id,
                      ).length;
                      return (
                        <div
                          key={b.id}
                          onClick={() => handleOpenBrandPage(b.id)}
                          className={`group p-6 rounded-2xl border transition-all duration-300 cursor-pointer hover:-translate-y-1 relative backdrop-blur-md shadow-md ${
                            lightMode
                              ? "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xl text-slate-800"
                              : "bg-[#0d0b1f]/30 border-white/5 hover:border-white/10 hover:bg-[#12102b]/50 hover:shadow-2xl hover:shadow-purple-950/10"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span
                              className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm"
                              style={{
                                backgroundColor: `${b.color}15`,
                                color: b.color,
                                border: `1px solid ${b.color}30`,
                              }}
                            >
                              {b.type}
                            </span>
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all text-base ${
                                lightMode
                                  ? "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                  : "bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-slate-300"
                              }`}
                            >
                              📁
                            </div>
                          </div>

                          <h2
                            className={`text-xl font-bold tracking-tight group-hover:text-indigo-400 transition-colors ${
                              lightMode ? "text-slate-900" : "text-white"
                            }`}
                          >
                            {b.name}
                          </h2>

                          <div className="mt-4 flex items-baseline gap-1.5 text-slate-500">
                            <span
                              className={`text-2xl font-black ${
                                lightMode ? "text-slate-800" : "text-white"
                              }`}
                            >
                              {countFiles}
                            </span>
                            <span className="text-xs font-medium">
                              ficheiros guardados
                            </span>
                          </div>

                          <div
                            className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl opacity-40 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: b.color }}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ==========================================
             VISUALIZAÇÃO DE UMA ENTIDADE / PASTA ESPECÍFICA
             ========================================== */
          <div className="flex-1 flex flex-col overflow-hidden relative z-10">
            {/* Barra Superior da Entidade Activa */}
            <div
              className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md ${
                lightMode ? "bg-white/90 border-slate-200" : "bg-[#0b091a]/40 border-white/5"
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView("hub")}
                  className={`p-2.5 rounded-xl transition-all border ${
                    lightMode
                      ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                  title="Voltar ao Hub"
                >
                  ⬅
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shadow-md"
                      style={{
                        backgroundColor: activeBrand?.color,
                        boxShadow: `0 0 10px ${activeBrand?.color}`,
                      }}
                    ></span>
                    <h1
                      className={`text-2xl font-black tracking-tight ${lightMode ? "text-slate-900" : "text-white"}`}
                    >
                      {activeBrand?.name}
                    </h1>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ID Estático:{" "}
                    <span className="font-mono bg-slate-950/10 px-1 py-0.5 rounded text-slate-400">
                      {selectedBrandId ? getTargetUuid(selectedBrandId) : ""}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddFolder}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 transition-colors"
                >
                  📁 Nova Pasta
                </button>
                <button
                  onClick={triggerFileSelection}
                  disabled={!selectedFolderName}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  📤 Carregar Arquivos
                </button>
              </div>
            </div>

            {/* Sub-Navegação de Pastas Estilo Tabs */}
            <div
              className={`px-6 py-3 border-b flex items-center justify-between gap-4 overflow-x-auto custom-scrollbar ${
                lightMode ? "bg-slate-100/50 border-slate-200" : "bg-[#090717]/20 border-white/5"
              }`}
            >
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
                {activeBrand?.folders.map((folder) => {
                  const isSelected = selectedFolderName === folder;
                  const fCount = files.filter(
                    (f) =>
                      f.brandId === selectedBrandId && f.folderName === folder,
                  ).length;

                  return (
                    <div
                      key={folder}
                      onClick={() => setSelectedFolderName(folder)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 flex items-center gap-2 border ${
                        isSelected
                          ? lightMode
                            ? "bg-white border-slate-300 text-indigo-600 shadow-sm"
                            : "bg-white/10 border-white/10 text-white shadow-inner"
                          : lightMode
                            ? "bg-transparent border-transparent text-slate-500 hover:bg-slate-100"
                            : "bg-transparent border-transparent text-slate-400 hover:bg-white/5"
                      }`}
                    >
                      <span>📂 {folder}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                          isSelected
                            ? "bg-indigo-500/20 text-indigo-400"
                            : "bg-slate-950/20 text-slate-500"
                        }`}
                      >
                        {fCount}
                      </span>
                      <button
                        onClick={(e) => handleEliminarFolder(e, folder)}
                        className="text-slate-500 hover:text-rose-400 transition-colors ml-1 font-normal text-sm"
                        title="Eliminar Pasta"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Listagem de Ficheiros */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {loadingFiles ? (
                <div className="h-40 flex items-center justify-center text-sm text-slate-500 gap-2 font-medium">
                  <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  A ler repositório na Cloud...
                </div>
              ) : currentFiles.length === 0 ? (
                <div
                  className={`h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-6 ${
                    lightMode ? "border-slate-200" : "border-white/5"
                  }`}
                >
                  <p className="text-2xl mb-1">📦</p>
                  <h3
                    className={`text-sm font-bold ${lightMode ? "text-slate-700" : "text-slate-300"}`}
                  >
                    Nenhum ficheiro detetado
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Esta subpasta está vazia. Arrasta ou clica no botão superior para
                    guardar referências.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {currentFiles.map((file) => {
                    const isImage = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(
                      file.fileName,
                    );
                    return (
                      <div
                        key={file.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 group transition-all relative ${
                          lightMode
                            ? "bg-white border-slate-200 hover:shadow-lg text-slate-800"
                            : "bg-[#0d0b1f]/20 border-white/5 hover:border-white/10 hover:bg-[#0f0d24]/50"
                        }`}
                      >
                        <div>
                          {/* Miniatura ou Preview do Tipo de Ficheiro */}
                          <div
                            className={`w-full h-32 rounded-lg mb-3 overflow-hidden flex items-center justify-center relative border shadow-inner ${
                              lightMode ? "bg-slate-50 border-slate-100" : "bg-slate-950/40 border-white/5"
                            }`}
                          >
                            {isImage ? (
                              <img
                                src={file.fileUrl}
                                alt={file.fileName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-3xl filter drop-shadow">
                                📄
                              </span>
                            )}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={() => handleMoverFile(file.id)}
                                className="p-1.5 rounded-md bg-slate-900/80 text-white backdrop-blur hover:bg-slate-800 text-xs shadow"
                                title="Mover ficheiro de diretório"
                              >
                                🔄
                              </button>
                              <button
                                onClick={() =>
                                  handleEliminarFile(file.id, file.fileName)
                                }
                                className="p-1.5 rounded-md bg-rose-950/80 text-rose-300 backdrop-blur hover:bg-rose-900 text-xs shadow border border-rose-500/20"
                                title="Eliminar definitivamente"
                              >
                                🗑
                              </button>
                            </div>
                          </div>

                          <p
                            className={`text-xs font-bold line-clamp-2 break-all ${
                              lightMode ? "text-slate-900" : "text-white"
                            }`}
                            title={file.fileName}
                          >
                            {file.fileName}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
                          <span className="text-[10px] font-mono text-slate-500">
                            {file.size}
                          </span>
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`text-[10px] font-bold tracking-wider uppercase transition-colors ${
                              lightMode
                                ? "text-indigo-600 hover:text-indigo-700"
                                : "text-indigo-400 hover:text-indigo-300"
                            }`}
                          >
                            Aceder Ativo ↗
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}