import React, { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";

// Importação unificada e segura do cliente global
import { supabase } from "../supabaseClient";

const BRAND_UUID_MAP = {
  nomad: "236cfb9a-2ac-48de-bcbd-1f651ef4664e",
  communities: "56f31452-acc2-467f-b914-d9587672c373",
  sinfon: "a63174db-32f9-41f9-b3c1-120f434bd0ba",
  factor: "eeb7d598-8bac-4c61-aeef-bd4d658c973b",
};

export default function Dashboard({ user, onSignOut }) {
  const [darkMode, setDarkMode] = useState(false);

  const [brands, setBrands] = useState([
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
      color: "#182e61",
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

  const [files, setFiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const [currentView, setCurrentView] = useState("hub");
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState("");

  const fileInputRef = useRef(null);
  const activeBrand = brands.find((b) => b.id === selectedBrandId);
  const currentFiles = files.filter(
    (f) => f.brandId === selectedBrandId && f.folderName === selectedFolderName,
  );

  const handleAddNewEntity = async (type) => {
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
      cancelButtonColor: "#94A3B8",
      background: darkMode ? "#1E293B" : "#FFFFFF",
      color: darkMode ? "#FFFFFF" : "#1E293B",
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

    const newEntity = {
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
      background: darkMode ? "#1E293B" : "#FFFFFF",
      color: darkMode ? "#FFFFFF" : "#1E293B",
    });
  };

  const handleDeleteEntity = async (e, id, name) => {
    e.stopPropagation();

    const { isConfirmed } = await Swal.fire({
      title: `Eliminar ${name}?`,
      text: "Tens a certeza? Esta ação irá remover este item da listagem lateral.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, eliminar!",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#94A3B8",
      background: darkMode ? "#1E293B" : "#FFFFFF",
      color: darkMode ? "#FFFFFF" : "#1E293B",
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
      background: darkMode ? "#1E293B" : "#FFFFFF",
      color: darkMode ? "#FFFFFF" : "#1E293B",
    });
  };

  useEffect(() => {
    async function loadAllFiles() {
      setLoadingFiles(true);
      try {
        const { data, error } = await supabase.from("files").select("*");
        if (error) throw error;

        const getFrontendBrandId = (dbUuid) => {
          return (
            Object.keys(BRAND_UUID_MAP).find(
              (key) => BRAND_UUID_MAP[key] === dbUuid,
            ) || dbUuid
          );
        };

        const maps = data.map((f) => {
          let displaySize = "0 KB";
          if (f.tamanho_bytes) {
            const sizeInMB = (f.tamanho_bytes / (1024 * 1024)).toFixed(2);
            displaySize =
              sizeInMB > 0.1
                ? `${sizeInMB} MB`
                : `${(f.tamanho_bytes / 1024).toFixed(0)} KB`;
          }

          return {
            id: f.id,
            brandId: getFrontendBrandId(f.brand_id),
            folderName: f.folder_name,
            fileName: f.file_name,
            fileUrl: f.file_url,
            size: displaySize,
            createdAt: f.created_at,
          };
        });
        setFiles(maps);

        const mockActivities = data
          .slice(-5)
          .reverse()
          .map((f, index) => {
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
              id: `act-${index}`,
              user: "Administrador",
              action: "adicionou",
              fileName: f.file_name,
              folderName: f.folder_name,
              brandName: brandObj ? brandObj.name : "Entidade",
              time: formattedTime,
            };
          });
        setActivities(mockActivities);
      } catch (err) {
        console.error("Erro ao ler a Base de Dados:", err.message);
      } finally {
        setLoadingFiles(false);
      }
    }
    loadAllFiles();
  }, [brands]);

  const handleOpenBrandPage = (brandId) => {
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

    const current_time = new Date();
    setBrands((prev) =>
      prev.map((b) =>
        b.id === selectedBrandId
          ? { ...b, folders: [...b.folders, trimmed] }
          : b,
      ),
    );
    setSelectedFolderName(trimmed);
  };

  const handleEliminarFolder = async (e, folderName) => {
    e.stopPropagation();
    const confirmado = window.confirm(
      `ATENÇÃO: Tens a certeza que queres eliminar a pasta "${folderName}"? Todos os ficheiros dentro desta pasta serão apagados permanentemente.`,
    );
    if (!confirmado) return;

    try {
      const targetUuid = BRAND_UUID_MAP[selectedBrandId];
      if (!targetUuid) {
        throw new Error(
          `Não foi encontrado um UUID configurado para a correspondente a: "${selectedBrandId}"`,
        );
      }

      const { error } = await supabase
        .from("files")
        .delete()
        .eq("brand_id", targetUuid)
        .eq("folder_name", folderName);

      if (error) throw error;

      // Registar a atividade de remoção da pasta
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
        const remainingFolders = activeBrand.folders.filter(
          (f) => f !== folderName,
        );
        setSelectedFolderName(remainingFolders[0] || "");
      }

      alert(`Pasta "${folderName}" eliminada com sucesso!`);
    } catch (error) {
      console.error("Erro ao eliminar a pasta:", error.message);
      alert(`Não foi possível eliminar a pasta: ${error.message}`);
    }
  };

  const handleEliminarFile = async (fileId, fileName) => {
    const confirmado = window.confirm(
      `Tens a certeza que queres apagar o ficheiro "${fileName}"?`,
    );
    if (!confirmado) return;

    try {
      const { error } = await supabase.from("files").delete().eq("id", fileId);

      if (error) throw error;

      // Registar a atividade de eliminação do ficheiro individual
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
    } catch (error) {
      console.error("Erro ao apagar ficheiro:", error.message);
      alert(`Erro ao apagar: ${error.message}`);
    }
  };

  const handleMoverFile = async (fileId) => {
    const empresas = {};
    const marcas = {};

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
      inputValue: selectedBrandId,
      showCancelButton: true,
      confirmButtonText: "Seguinte ➡",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#6366F1",
      cancelButtonColor: "#94A3B8",
      background: darkMode ? "#1E293B" : "#FFFFFF",
      color: darkMode ? "#FFFFFF" : "#1E293B",
    });

    if (!destinoId) return;

    const alvo = brands.find((b) => b.id === destinoId);

    if (!alvo || alvo.folders.length === 0) {
      Swal.fire({
        title: "Aviso",
        text: "O destino selecionado não possui nenhuma pasta criada para receber ficheiros.",
        icon: "warning",
        confirmButtonColor: "#6366F1",
        background: darkMode ? "#1E293B" : "#FFFFFF",
        color: darkMode ? "#FFFFFF" : "#1E293B",
      });
      return;
    }

    const opcoesPastas = {};
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
      cancelButtonColor: "#94A3B8",
      background: darkMode ? "#1E293B" : "#FFFFFF",
      color: darkMode ? "#FFFFFF" : "#1E293B",
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
        background: darkMode ? "#1E293B" : "#FFFFFF",
        color: darkMode ? "#FFFFFF" : "#1E293B",
      });
    } catch (error) {
      console.error("Erro ao mover ficheiro:", error.message);
      Swal.fire({
        title: "Erro na operação",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#EF4444",
        background: darkMode ? "#1E293B" : "#FFFFFF",
        color: darkMode ? "#FFFFFF" : "#1E293B",
      });
    }
  };

  const triggerFileSelection = () => {
    if (!selectedFolderName) {
      alert("Seleciona uma pasta primeiro!");
      return;
    }
    fileInputRef.current.click();
  };

  const handleRealFileUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length === 0) return;

    const uploadedFile = selectedFiles[0];
    const fileExtension = uploadedFile.name.split(".").pop();
    const cleanName = uploadedFile.name
      .replace(`.${fileExtension}`, "")
      .replace(/[^a-zA-Z0-9]/g, "_");

    const storagePath = `${activeBrand.id}/${selectedFolderName}/${Date.now()}_${cleanName}.${fileExtension}`;

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

      const sizeInMB = (uploadedFile.size / (1024 * 1024)).toFixed(2);
      const displaySize =
        sizeInMB > 0.1
          ? `${sizeInMB} MB`
          : `${(uploadedFile.size / 1024).toFixed(0)} KB`;

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

      const newFileObj = {
        id: dbData[0].id,
        brandId: selectedBrandId,
        folderName: selectedFolderName,
        fileName: uploadedFile.name,
        fileUrl: publicUrl,
        size: displaySize,
        createdAt: dbData[0].created_at,
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
          brandName: activeBrand.name,
          time: timeString,
        },
        ...prev,
      ]);
    } catch (error) {
      console.error(error);
      alert(`Erro: ${error.message}`);
    } finally {
      e.target.value = "";
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
    ? `conic-gradient(${gradientParts.join(", ")}, #E2E8F0 ${accumulatedPercentage}% 100%)`
    : "";

  return (
    <div
      className={`flex h-screen w-full font-sans antialiased overflow-hidden transition-colors duration-300 ${darkMode ? "bg-[#0F172A] text-slate-200" : "bg-[#F8FAFC] text-[#1E293B]"}`}
    >
      <style>{`
        .swal2-select, .swal2-input {
          background-color: ${darkMode ? "#1E293B" : "#FFFFFF"} !important;
          color: ${darkMode ? "#FFFFFF" : "#1E293B"} !important;
          border: 1px solid ${darkMode ? "#475569" : "#CBD5E1"} !important;
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
          background: ${darkMode ? "#334155" : "#CBD5E1"};
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

      {/* SIDEBAR */}
      <aside
        className={`w-66 min-w-[260px] flex flex-col justify-between border-r shadow-sm z-20 transition-colors duration-300 ${darkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100"}`}
      >
        <div>
          <div
            className={`p-6 border-b flex items-center justify-between ${darkMode ? "border-slate-800" : "border-slate-100"}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md">
                E
              </div>
              <span
                onClick={() => setCurrentView("hub")}
                className={`font-black text-xl tracking-tight cursor-pointer ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                Eugeen
              </span>
            </div>
          </div>

          <div className="px-4 py-6">
            <nav className="space-y-1">
              <button
                onClick={() => setCurrentView("hub")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${currentView === "hub" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md" : darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-50 text-slate-500"}`}
              >
                📊 Dashboard Global
              </button>

              {/* SEPARAÇÃO: AS NOSSAS EMPRESAS */}
              <div className="pt-6">
                <div className="px-4 flex items-center justify-between mb-3 group">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    As Nossas Empresas
                  </p>
                  <button
                    onClick={() => handleAddNewEntity("empresa")}
                    className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer px-1"
                    title="Adicionar Nova Empresa"
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
                        className={`entity-btn w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentView === "brand-view" && selectedBrandId === b.id ? "bg-indigo-500/10 text-indigo-600 font-bold" : darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-50 text-slate-600"}`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: b.color }}
                          ></span>
                          <span className="truncate">{b.name}</span>
                        </div>
                        <span
                          onClick={(e) => handleDeleteEntity(e, b.id, b.name)}
                          className="delete-btn text-xs text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="Eliminar"
                        >
                          🗑️
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* SEPARAÇÃO: AS NOSSAS MARCAS */}
              <div className="pt-4">
                <div className="px-4 flex items-center justify-between mb-3 group">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    As Nossas Marcas
                  </p>
                  <button
                    onClick={() => handleAddNewEntity("marca")}
                    className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer px-1"
                    title="Adicionar Nova Marca"
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
                        className={`entity-btn w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentView === "brand-view" && selectedBrandId === b.id ? "bg-indigo-500/10 text-indigo-600 font-bold" : darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-50 text-slate-600"}`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: b.color }}
                          ></span>
                          <span className="truncate">{b.name}</span>
                        </div>
                        <span
                          onClick={(e) => handleDeleteEntity(e, b.id, b.name)}
                          className="delete-btn text-xs text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="Eliminar"
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
          className={`p-4 border-t flex flex-col gap-3 ${darkMode ? "border-slate-800 bg-[#111827]/40" : "border-slate-100 bg-slate-50/50"}`}
        >
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all border ${darkMode ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50"}`}
          >
            {darkMode
              ? "☀️ Mudar para Modo Claro"
              : "🌙 Mudar para Modo Escuro"}
          </button>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="truncate text-slate-400 font-medium pr-2">
              {user?.email || "cardoso200614@gmail.com"}
            </span>
            <button
              onClick={onSignOut}
              className="text-slate-400 hover:text-rose-500 font-bold transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* VIEW 1: HUB GLOBAL */}
        {currentView === "hub" && (
          <div className="flex flex-col h-full w-full overflow-y-auto">
            <header
              className={`h-20 border-b px-8 flex items-center justify-between shrink-0 transition-colors ${darkMode ? "border-slate-800 bg-[#0F172A]" : "border-slate-100 bg-white"}`}
            >
              <div>
                <h1
                  className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}
                >
                  Hub de Arquivos Digitais
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gestão de armazenamento dedicada e isolada
                </p>
              </div>
              <span className="text-xs bg-indigo-500/10 text-indigo-600 px-3 py-1.5 rounded-xl font-bold border border-indigo-500/20">
                {files.length} Arquivos no Total
              </span>
            </header>

            <div className="p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* METRICS DONUT CARD */}
                <div
                  className={`p-6 rounded-2xl border shadow-sm flex flex-col items-center justify-center relative min-h-62.5 transition-colors ${darkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100"}`}
                >
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest absolute top-5 left-5">
                    Métricas Globais
                  </h3>

                  <div className="flex items-center gap-8 mt-6 w-full justify-center">
                    <div
                      className={`w-32 h-32 rounded-full relative flex items-center justify-center shadow-md shrink-0`}
                      style={{
                        backgroundImage: conicGradientValue || "none",
                        backgroundColor: darkMode ? "#334155" : "#E2E8F0",
                      }}
                    >
                      <div
                        className={`w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-sm ${darkMode ? "bg-[#1E293B]" : "bg-white"}`}
                      >
                        <span
                          className={`text-3xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}
                        >
                          {files.length}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          Ficheiros
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      {brands.map((b) => {
                        const count = files.filter(
                          (f) => f.brandId === b.id,
                        ).length;
                        return (
                          <div key={b.id} className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shadow-sm"
                              style={{ backgroundColor: b.color }}
                            ></span>
                            <span
                              className={`font-semibold truncate max-w-25 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                            >
                              {b.name}
                            </span>
                            <span className="text-slate-400 font-bold">
                              ({count})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* BRANDS QUICK LINK GRID */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {brands.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => handleOpenBrandPage(b.id)}
                      className={`p-6 rounded-2xl border shadow-sm cursor-pointer hover:scale-[1.01] hover:shadow-md transition-all flex flex-col justify-between min-h-28.75 ${darkMode ? "bg-[#1E293B] border-slate-800 hover:border-slate-700" : "bg-white border-slate-100 hover:border-slate-200"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {b.name}{" "}
                            <span className="text-[10px] lowercase opacity-60">
                              ({b.type})
                            </span>
                          </h3>
                          <div
                            className={`text-3xl font-black mt-2 ${darkMode ? "text-white" : "text-slate-900"}`}
                          >
                            {files.filter((f) => f.brandId === b.id).length}{" "}
                            <span className="text-xs font-medium text-slate-400">
                              arquivos
                            </span>
                          </div>
                        </div>
                        <span
                          className="w-2 h-10 rounded-full shadow-sm"
                          style={{ backgroundColor: b.color }}
                        ></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RECENT ACTIVITY CARD */}
              <div
                className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${darkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100"}`}
              >
                <div
                  className={`p-5 border-b ${darkMode ? "border-slate-800" : "border-slate-50"}`}
                >
                  <h3
                    className={`font-bold text-base ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    Atividades Recentes
                  </h3>
                </div>
                <div className="p-6">
                  {activities.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                      Nenhuma atividade registada ainda.
                    </p>
                  ) : (
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {activities.map((activity, actIdx) => (
                          <li key={activity.id}>
                            <div className="relative pb-8">
                              {actIdx !== activities.length - 1 ? (
                                <span
                                  className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}
                                  aria-hidden="true"
                                />
                              ) : null}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span
                                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ${
                                      activity.action === "adicionou"
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : activity.action === "eliminou_pasta"
                                          ? "bg-amber-500/10 text-amber-500"
                                          : "bg-rose-500/10 text-rose-500"
                                    } ${darkMode ? "ring-[#1E293B]" : "ring-white"}`}
                                  >
                                    {activity.action === "adicionou"
                                      ? "➕"
                                      : activity.action === "eliminou_pasta"
                                        ? "📁"
                                        : "🗑️"}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                  <p
                                    className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}
                                  >
                                    <span
                                      className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
                                    >
                                      {activity.user}
                                    </span>{" "}
                                    {activity.action === "adicionou" ? (
                                      <>
                                        adicionou o ficheiro{" "}
                                        <span className="font-semibold text-indigo-500">
                                          {activity.fileName}
                                        </span>{" "}
                                        na pasta{" "}
                                        <span className="font-medium">
                                          /{activity.folderName}
                                        </span>{" "}
                                        de{" "}
                                        <span className="font-bold">
                                          {activity.brandName}
                                        </span>
                                        .
                                      </>
                                    ) : activity.action === "eliminou_pasta" ? (
                                      <>
                                        eliminou a pasta completa{" "}
                                        <span className="font-semibold text-amber-500">
                                          /{activity.folderName}
                                        </span>{" "}
                                        de{" "}
                                        <span className="font-bold">
                                          {activity.brandName}
                                        </span>{" "}
                                        com todos os seus ficheiros.
                                      </>
                                    ) : (
                                      <>
                                        eliminou o ficheiro{" "}
                                        <span className="font-semibold text-rose-500">
                                          {activity.fileName}
                                        </span>{" "}
                                        da pasta{" "}
                                        <span className="font-medium">
                                          /{activity.folderName}
                                        </span>{" "}
                                        de{" "}
                                        <span className="font-bold">
                                          {activity.brandName}
                                        </span>
                                        .
                                      </>
                                    )}
                                  </p>
                                  <div className="text-right text-xs whitespace-nowrap text-slate-400 shrink-0">
                                    <time>{activity.time}</time>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: BRAND DETAIL / FOLDERS VIEW */}
        {currentView === "brand-view" && activeBrand && (
          <div className="flex flex-col h-full w-full overflow-hidden">
            <header
              className={`h-20 border-b px-8 flex items-center justify-between shrink-0 transition-colors ${darkMode ? "border-slate-800 bg-[#0F172A]" : "border-slate-100 bg-white"}`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView("hub")}
                  className={`p-2 rounded-xl border text-sm font-bold shadow-sm transition-all ${darkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                >
                  ⬅ Voltar
                </button>
                <div>
                  <h1
                    className={`text-2xl font-black tracking-tight flex items-center gap-3 ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: activeBrand.color }}
                    ></span>
                    {activeBrand.name}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Visualização das pastas e arquivos locais e na nuvem
                  </p>
                </div>
              </div>

              <button
                onClick={triggerFileSelection}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md hover:opacity-95 transition-all"
              >
                🪂 Carregar Arquivo
              </button>
            </header>

            <div className="flex flex-1 overflow-hidden h-full w-full">
              {/* SUB SIDEBAR: PASTAS DENTRO DA ENTIDADE */}
              <div
                className={`w-60 border-r p-4 space-y-4 flex flex-col justify-between shrink-0 transition-colors ${darkMode ? "border-slate-800 bg-[#1E293B]/50" : "border-slate-100 bg-slate-50/50"}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pastas
                    </span>
                    <button
                      onClick={handleAddFolder}
                      className="text-xs font-bold text-indigo-500 hover:underline"
                    >
                      ＋ Criar
                    </button>
                  </div>

                  {activeBrand.folders.map((folder) => (
                    <button
                      key={folder}
                      onClick={() => setSelectedFolderName(folder)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${selectedFolderName === folder ? "bg-indigo-600 text-white shadow-sm" : darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-white text-slate-600 hover:shadow-sm"}`}
                    >
                      <span className="truncate">📁 {folder}</span>
                      <span
                        onClick={(e) => handleEliminarFolder(e, folder)}
                        className={`text-[10px] p-1 rounded hover:bg-rose-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 ${selectedFolderName === folder ? "text-white" : "text-slate-400"}`}
                        title="Eliminar Pasta"
                      >
                        🗑️
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* FILES DISPLAY GRID / LIST */}
              <div className="flex-1 p-8 overflow-y-auto w-full h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className={`text-lg font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    Conteúdo de: /{selectedFolderName || "Nenhuma Pasta"}
                  </h2>
                  <span className="text-xs font-bold text-slate-400 bg-slate-500/5 px-2.5 py-1 rounded-lg">
                    {currentFiles.length} ficheiros encontrados
                  </span>
                </div>

                {loadingFiles ? (
                  <p className="text-sm text-slate-400 py-12 text-center">
                    A ler os dados do Supabase...
                  </p>
                ) : currentFiles.length === 0 ? (
                  <div
                    className={`border-2 border-dashed rounded-2xl p-12 text-center max-w-xl mx-auto my-8 ${darkMode ? "border-slate-800" : "border-slate-200"}`}
                  >
                    <p className="text-2xl mb-2">🎈</p>
                    <p
                      className={`text-sm font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Esta pasta está completamente vazia
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Podes carregar imagens ou PDFs diretamente para aqui
                      clicando no botão no topo direito.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`border rounded-2xl p-4 shadow-sm relative group flex flex-col justify-between min-h-40 transition-colors ${darkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-100"}`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-500 uppercase px-2 py-0.5 rounded-md tracking-wider">
                              {file.fileName.split(".").pop()}
                            </span>
                            <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                              {file.size}
                            </span>
                          </div>

                          <h4
                            className={`text-sm font-bold tracking-tight break-all line-clamp-2 ${darkMode ? "text-slate-200" : "text-slate-800"}`}
                            title={file.fileName}
                          >
                            {file.fileName}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-dashed border-slate-500/10">
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex-1 text-center py-2 rounded-xl text-xs font-bold transition-colors ${darkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                          >
                            👁 Abrir
                          </a>
                          <button
                            onClick={() => handleMoverFile(file.id)}
                            className={`p-2 rounded-xl text-xs font-bold transition-colors ${darkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}
                            title="Mover de Pasta / Empresa"
                          >
                            📦
                          </button>
                          <button
                            onClick={() =>
                              handleEliminarFile(file.id, file.fileName)
                            }
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold transition-colors"
                            title="Apagar Ficheiro"
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
