// <stdin>
import React, { useState, useEffect } from "https://esm.sh/react@18.2.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js?deps=react@18.2.0,react-dom@18.2.0";
import { Search, Plus, Download, Upload, Edit, Trash2, MessageCircle, Calendar, Settings, FileText, User, DollarSign } from "https://esm.sh/lucide-react?deps=react@18.2.0,react-dom@18.2.0";
var supabaseUrl = "https://ivumtyhdkjurerknjnpt.supabase.co";
var supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dW10eWhka2p1cmVya25qbnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjUyMjMsImV4cCI6MjA2NTk0MTIyM30.rbkqMbSYczGbJdGSjUvARGLIU3Gf-B9q0RWm0vW99Bs";
var supabase = createClient(supabaseUrl, supabaseAnonKey);
var SistemaGestaoClientes = () => {
  const [activeTab, setActiveTab] = useState("clientes");
  const [clientes, setClientes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [custos, setCustos] = useState({});
  const [configWhatsApp, setConfigWhatsApp] = useState("");
  const [logsSearchTerm, setLogsSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [servidorFilter, setServidorFilter] = useState("Todos");
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortByDate, setSortByDate] = useState("asc");
  const [showOnlyCloseToExpire, setShowOnlyCloseToExpire] = useState(false);
  const [clientForm, setClientForm] = useState({
    nome: "",
    telefone: "",
    servidor: "P2X",
    plano_mensal: "",
    plano_trimestral: "",
    data_vencimento: "",
    observacoes: ""
  });
  const [costForm, setCostForm] = useState({
    p2x: 8,
    p2_server: 10,
    rtv: 8,
    rtv_vods: 8,
    cplayer: 8
  });
  const servidores = ["P2X", "P2_SERVER", "RTV", "RTV-VODs", "CPLAYER"];
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };
  const getServerColor = (servidor) => {
    const colors = {
      "P2X": "#836FFF",
      // SlateBlue1
      "P2_SERVER": "#00FFFF",
      // Aqua / Cyan
      "CPLAYER": "#87CEEB",
      // SkyBlue
      "RTV": "#98FB98",
      // PaleGreen
      "RTV-VODs": "#DAA520"
      // Goldenrod
    };
    return colors[servidor] || "#3B82F6";
  };
  const formatDate = (date) => {
    const localDate = /* @__PURE__ */ new Date(date + "T00:00:00");
    return localDate.toLocaleDateString("pt-BR");
  };
  const formatPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    return `+55${cleaned}`;
  };
  const calculateDaysUntilExpiry = (expiryDate) => {
    const expiry = /* @__PURE__ */ new Date(expiryDate + "T00:00:00");
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
  };
  const calculateDiasAtivos = (expiryDate) => {
    const expiry = /* @__PURE__ */ new Date(expiryDate + "T00:00:00");
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
    if (diffDays >= 0) {
      return `Faltam ${diffDays} dias`;
    } else {
      return `Venceu h\xE1 ${Math.abs(diffDays)} dias`;
    }
  };
  const getStatus = (expiryDate) => {
    const expiry = /* @__PURE__ */ new Date(expiryDate + "T00:00:00");
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    return expiry >= today ? "Ativo" : "Vencido";
  };
  useEffect(() => {
    loadClientes();
    loadLogs();
    loadCustos();
    loadWhatsAppConfig();
  }, []);
  const loadClientes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("gerenciador_clientes").select("*").order("nome");
    if (error) {
      console.error("Erro ao carregar clientes:", error);
    } else {
      const clientesWithStatus = data.map((cliente) => {
        const diasAteVencimento = calculateDaysUntilExpiry(cliente.data_vencimento);
        return {
          ...cliente,
          status: getStatus(cliente.data_vencimento),
          dias_ate_vencimento: diasAteVencimento
          // dias_ativo vem diretamente do banco, sem cálculos
        };
      });
      setClientes(clientesWithStatus);
    }
    setLoading(false);
  };
  const loadLogs = async () => {
    const { data, error } = await supabase.from("gerenciador_logs_recarga").select("*").order("data_recarga", { ascending: false });
    if (error) {
      console.error("Erro ao carregar logs:", error);
    } else {
      setLogs(data);
    }
  };
  const loadCustos = async () => {
    const { data, error } = await supabase.from("gerenciador_custos_servidores").select("*").single();
    if (error) {
      console.error("Erro ao carregar custos:", error);
    } else if (data) {
      setCostForm(data);
      setCustos(data);
    }
  };
  const loadWhatsAppConfig = async () => {
    const { data, error } = await supabase.from("gerenciador_configuracoes_whatsapp").select("mensagem_padrao").single();
    if (error) {
      console.error("Erro ao carregar config WhatsApp:", error);
    } else if (data) {
      setConfigWhatsApp(data.mensagem_padrao);
    }
  };
  const saveClient = async () => {
    if (!clientForm.nome || !clientForm.telefone || !clientForm.data_vencimento) {
      alert("Preencha todos os campos obrigat\xF3rios");
      return;
    }
    const clientData = {
      nome: clientForm.nome,
      telefone: formatPhone(clientForm.telefone),
      servidor: clientForm.servidor,
      plano_mensal: parseFloat(clientForm.plano_mensal) || 0,
      plano_trimestral: parseFloat(clientForm.plano_trimestral) || 0,
      data_vencimento: clientForm.data_vencimento,
      observacoes: clientForm.observacoes || "",
      status: getStatus(clientForm.data_vencimento)
    };
    let result;
    if (editingClient) {
      const updateData = {
        ...clientData,
        id: editingClient.id
      };
      result = await supabase.from("gerenciador_clientes").update(updateData).eq("id", editingClient.id);
    } else {
      const maxIdResult = await supabase.from("gerenciador_clientes").select("id").order("id", { ascending: false }).limit(1);
      let newId = 1;
      if (maxIdResult.data && maxIdResult.data.length > 0) {
        newId = maxIdResult.data[0].id + 1;
      }
      const insertData = {
        ...clientData,
        id: newId
      };
      result = await supabase.from("gerenciador_clientes").insert([insertData]);
    }
    if (result.error) {
      console.error("Erro ao salvar cliente:", result.error);
      alert("Erro ao salvar cliente: " + result.error.message);
    } else {
      alert(`Cliente ${editingClient ? "atualizado" : "criado"} com sucesso!`);
      setShowClientForm(false);
      setEditingClient(null);
      setClientForm({
        nome: "",
        telefone: "",
        servidor: "P2X",
        plano_mensal: "",
        plano_trimestral: "",
        data_vencimento: "",
        observacoes: ""
      });
      loadClientes();
    }
  };
  const deleteClient = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    const { error } = await supabase.from("gerenciador_clientes").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir cliente:", error);
      alert("Erro ao excluir cliente");
    } else {
      alert("Cliente exclu\xEDdo com sucesso!");
      loadClientes();
    }
  };
  const addMonths = async (cliente, months) => {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const currentExpiry = /* @__PURE__ */ new Date(cliente.data_vencimento + "T00:00:00");
    let newExpiry;
    if (currentExpiry < today) {
      newExpiry = new Date(today);
      newExpiry.setMonth(newExpiry.getMonth() + months);
    } else {
      newExpiry = new Date(currentExpiry);
      newExpiry.setMonth(newExpiry.getMonth() + months);
    }
    const formattedDate = newExpiry.toISOString().split("T")[0];
    const { error: clientError } = await supabase.from("gerenciador_clientes").update({
      data_vencimento: formattedDate,
      status: "Ativo"
    }).eq("id", cliente.id);
    if (clientError) {
      console.error("Erro ao adicionar meses:", clientError);
      alert("Erro ao adicionar meses");
      return;
    }
    const { error: logError } = await supabase.from("gerenciador_logs_recarga").insert([{
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      servidor: cliente.servidor,
      data_antes: cliente.data_vencimento,
      data_depois: formattedDate,
      meses_adicionados: months
    }]);
    if (logError) {
      console.error("Erro ao salvar log:", logError);
    }
    alert(`${months} m\xEAs(es) adicionado(s) com sucesso!`);
    loadClientes();
    loadLogs();
  };
  const saveCosts = async () => {
    const { error } = await supabase.from("gerenciador_custos_servidores").update(costForm).eq("id", 1);
    if (error) {
      console.error("Erro ao salvar custos:", error);
      alert("Erro ao salvar custos");
    } else {
      alert("Custos salvos com sucesso!");
      setCustos(costForm);
    }
  };
  const saveWhatsAppConfig = async () => {
    const { error } = await supabase.from("gerenciador_configuracoes_whatsapp").update({ mensagem_padrao: configWhatsApp }).eq("id", 1);
    if (error) {
      console.error("Erro ao salvar config WhatsApp:", error);
      alert("Erro ao salvar configura\xE7\xE3o do WhatsApp");
    } else {
      alert("Configura\xE7\xE3o do WhatsApp salva com sucesso!");
    }
  };
  const sendWhatsAppMessage = (cliente) => {
    let mensagem = configWhatsApp;
    mensagem = mensagem.replace("{nome}", cliente.nome);
    mensagem = mensagem.replace("{servidor}", cliente.servidor);
    mensagem = mensagem.replace("{plano_mensal}", formatCurrency(cliente.plano_mensal));
    mensagem = mensagem.replace("{plano_trimestral}", formatCurrency(cliente.plano_trimestral));
    mensagem = mensagem.replace("{data_vencimento}", formatDate(cliente.data_vencimento));
    mensagem = mensagem.replace("{dias_vencimento}", calculateDaysUntilExpiry(cliente.data_vencimento));
    mensagem = mensagem.replace("{status_vencimento}", cliente.status);
    const whatsappUrl = `https://wa.me/${cliente.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, "_blank");
  };
  const filteredClientes = clientes.filter((cliente) => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) || cliente.telefone.includes(searchTerm) || cliente.id.toString().includes(searchTerm) || cliente.dias_ativo && cliente.dias_ativo.toString().includes(searchTerm);
    const matchesStatus = statusFilter === "Todos" || cliente.status === statusFilter;
    const matchesServidor = servidorFilter === "Todos" || cliente.servidor === servidorFilter;
    let matchesCloseToExpire = true;
    if (showOnlyCloseToExpire) {
      const diasRestantes = calculateDaysUntilExpiry(cliente.data_vencimento);
      matchesCloseToExpire = diasRestantes === 3 || diasRestantes === 4 || diasRestantes === 5;
    }
    return matchesSearch && matchesStatus && matchesServidor && matchesCloseToExpire;
  }).sort((a, b) => {
    if (a.status === "Ativo" && b.status === "Vencido") return -1;
    if (a.status === "Vencido" && b.status === "Ativo") return 1;
    const dateA = /* @__PURE__ */ new Date(a.data_vencimento + "T00:00:00");
    const dateB = /* @__PURE__ */ new Date(b.data_vencimento + "T00:00:00");
    if (sortByDate === "asc") {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });
  const exportToCSV = () => {
    const csvData = filteredClientes.map((cliente) => ({
      "ID": cliente.id,
      "Nome": cliente.nome,
      "Telefone": cliente.telefone,
      "Servidor": cliente.servidor,
      "Plano Mensal": cliente.plano_mensal,
      "Plano Trimestral": cliente.plano_trimestral,
      "Data Vencimento": formatDate(cliente.data_vencimento),
      "Status": cliente.status,
      "Dias Ativo": cliente.dias_ativo,
      "Observa\xE7\xF5es": cliente.observacoes
    }));
    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-900 text-white" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gray-800 p-3 sm:p-4 border-b border-gray-700" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("h1", { className: "text-lg sm:text-xl font-bold" }, "Gest\xE3o De Clientes"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-green-400 hidden sm:inline" }, "Ricardo Moraes"), /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold" }, "R")))), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-800 p-3 sm:p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex space-x-2 sm:space-x-4 overflow-x-auto" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setActiveTab("clientes"),
      className: `flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded whitespace-nowrap ${activeTab === "clientes" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`
    },
    /* @__PURE__ */ React.createElement(User, { className: "w-4 h-4" }),
    /* @__PURE__ */ React.createElement("span", { className: "text-sm sm:text-base" }, "Clientes")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setActiveTab("logs"),
      className: `flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded whitespace-nowrap ${activeTab === "logs" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`
    },
    /* @__PURE__ */ React.createElement(FileText, { className: "w-4 h-4" }),
    /* @__PURE__ */ React.createElement("span", { className: "text-sm sm:text-base hidden sm:inline" }, "Relat\xF3rio de Logs"),
    /* @__PURE__ */ React.createElement("span", { className: "text-sm sm:text-base sm:hidden" }, "Logs")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setActiveTab("configuracoes"),
      className: `flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded whitespace-nowrap ${activeTab === "configuracoes" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`
    },
    /* @__PURE__ */ React.createElement(Settings, { className: "w-4 h-4" }),
    /* @__PURE__ */ React.createElement("span", { className: "text-sm sm:text-base" }, "Config")
  ))), /* @__PURE__ */ React.createElement("div", { className: "p-3 sm:p-6" }, activeTab === "clientes" && /* @__PURE__ */ React.createElement("div", null, !showClientForm ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "mb-4 sm:mb-6 space-y-3 sm:space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 sm:gap-4 items-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowClientForm(true),
      className: "flex items-center space-x-1 sm:space-x-2 bg-green-600 hover:bg-green-700 px-3 sm:px-4 py-2 rounded text-sm sm:text-base"
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "w-4 h-4" }),
    /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline" }, "Novo Cliente"),
    /* @__PURE__ */ React.createElement("span", { className: "sm:hidden" }, "Novo")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: exportToCSV,
      className: "flex items-center space-x-1 sm:space-x-2 bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 py-2 rounded text-sm sm:text-base"
    },
    /* @__PURE__ */ React.createElement(Download, { className: "w-4 h-4" }),
    /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline" }, "Exportar CSV"),
    /* @__PURE__ */ React.createElement("span", { className: "sm:hidden" }, "Export")
  ), /* @__PURE__ */ React.createElement("button", { className: "flex items-center space-x-1 sm:space-x-2 bg-gray-600 hover:bg-gray-700 px-3 sm:px-4 py-2 rounded text-sm sm:text-base" }, /* @__PURE__ */ React.createElement(Upload, { className: "w-4 h-4" }), /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline" }, "Importar CSV"), /* @__PURE__ */ React.createElement("span", { className: "sm:hidden" }, "Import"))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row gap-2 sm:gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "relative flex-1 sm:flex-none" }, /* @__PURE__ */ React.createElement(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Pesquisar...",
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 sm:gap-4" }, /* @__PURE__ */ React.createElement(
    "select",
    {
      value: statusFilter,
      onChange: (e) => setStatusFilter(e.target.value),
      className: "flex-1 sm:flex-none px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
    },
    /* @__PURE__ */ React.createElement("option", { value: "Todos" }, "Todos Status"),
    /* @__PURE__ */ React.createElement("option", { value: "Ativo" }, "Ativo"),
    /* @__PURE__ */ React.createElement("option", { value: "Vencido" }, "Vencido")
  ), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: servidorFilter,
      onChange: (e) => setServidorFilter(e.target.value),
      className: "flex-1 sm:flex-none px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
    },
    /* @__PURE__ */ React.createElement("option", { value: "Todos" }, "Todos Servidores"),
    servidores.map((servidor) => /* @__PURE__ */ React.createElement("option", { key: servidor, value: servidor }, servidor))
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center" }, /* @__PURE__ */ React.createElement("label", { className: "flex items-center space-x-2 cursor-pointer" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: showOnlyCloseToExpire,
      onChange: (e) => setShowOnlyCloseToExpire(e.target.checked),
      className: "w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "text-sm sm:text-base text-white" }, "Mostrar apenas clientes pr\xF3ximos do vencimento (3, 4, 5 dias)")))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-800 rounded-lg" }, /* @__PURE__ */ React.createElement("div", { className: "bg-green-600 p-3 sm:p-4 rounded-lg text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-xl sm:text-2xl font-bold" }, filteredClientes.filter((c) => c.status === "Ativo").length), /* @__PURE__ */ React.createElement("div", { className: "text-xs sm:text-sm" }, "Clientes Ativos"), /* @__PURE__ */ React.createElement("div", { className: "text-xs opacity-75" }, formatCurrency(filteredClientes.filter((c) => c.status === "Ativo").reduce((sum, c) => sum + (c.plano_mensal || 0), 0)))), /* @__PURE__ */ React.createElement("div", { className: "bg-red-600 p-3 sm:p-4 rounded-lg text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-xl sm:text-2xl font-bold" }, filteredClientes.filter((c) => c.status === "Vencido").length), /* @__PURE__ */ React.createElement("div", { className: "text-xs sm:text-sm" }, "Clientes Vencidos"), /* @__PURE__ */ React.createElement("div", { className: "text-xs opacity-75" }, formatCurrency(filteredClientes.filter((c) => c.status === "Vencido").reduce((sum, c) => sum + (c.plano_mensal || 0), 0)))), /* @__PURE__ */ React.createElement("div", { className: "bg-blue-600 p-3 sm:p-4 rounded-lg text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-xl sm:text-2xl font-bold" }, filteredClientes.length), /* @__PURE__ */ React.createElement("div", { className: "text-xs sm:text-sm" }, "Total de Clientes"), /* @__PURE__ */ React.createElement("div", { className: "text-xs opacity-75" }, formatCurrency(filteredClientes.reduce((sum, c) => sum + (c.plano_mensal || 0), 0)))), /* @__PURE__ */ React.createElement("div", { className: "bg-purple-600 p-3 sm:p-4 rounded-lg text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-xl sm:text-2xl font-bold" }, (filteredClientes.filter((c) => c.status === "Ativo").length / filteredClientes.length * 100 || 0).toFixed(1), "%"), /* @__PURE__ */ React.createElement("div", { className: "text-xs sm:text-sm" }, "Taxa de Ativos"), /* @__PURE__ */ React.createElement("div", { className: "text-xs opacity-75" }, "Percentual ativo"))), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-800 rounded-lg overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full min-w-[800px]" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-700" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm" }, "Nome"), /* @__PURE__ */ React.createElement("th", { className: "px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm hidden sm:table-cell" }, "Telefone"), /* @__PURE__ */ React.createElement("th", { className: "px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm" }, "Servidor"), /* @__PURE__ */ React.createElement("th", { className: "px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm hidden md:table-cell" }, "Plano Mensal"), /* @__PURE__ */ React.createElement("th", { className: "px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center space-x-1 sm:space-x-2" }, /* @__PURE__ */ React.createElement("span", null, "Vencimento"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setSortByDate(sortByDate === "asc" ? "desc" : "asc"),
      className: "text-gray-400 hover:text-white text-xs bg-gray-600 hover:bg-gray-500 px-1 sm:px-2 py-1 rounded",
      title: sortByDate === "asc" ? "Ordenar por mais distante" : "Ordenar por mais pr\xF3ximo"
    },
    sortByDate === "asc" ? "\u2191 A-Z" : "\u2193 Z-A"
  ))), /* @__PURE__ */ React.createElement("th", { className: "px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm" }, "Status"), /* @__PURE__ */ React.createElement("th", { className: "px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm hidden lg:table-cell" }, "Dias Ativo"), /* @__PURE__ */ React.createElement("th", { className: "px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm" }, "A\xE7\xF5es"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-700" }, loading ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "8", className: "px-4 py-8 text-center" }, "Carregando...")) : filteredClientes.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "8", className: "px-4 py-8 text-center text-gray-400" }, "Nenhum cliente encontrado")) : filteredClientes.map((cliente) => /* @__PURE__ */ React.createElement("tr", { key: cliente.id, className: "hover:bg-gray-750" }, /* @__PURE__ */ React.createElement("td", { className: "px-2 sm:px-4 py-2 sm:py-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm sm:text-base font-medium" }, cliente.nome), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 sm:hidden" }, cliente.telefone), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 md:hidden" }, formatCurrency(cliente.plano_mensal)), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 lg:hidden" }, calculateDiasAtivos(cliente.data_vencimento))), /* @__PURE__ */ React.createElement("td", { className: "px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell text-sm" }, cliente.telefone), /* @__PURE__ */ React.createElement("td", { className: "px-2 sm:px-4 py-2 sm:py-3" }, /* @__PURE__ */ React.createElement(
    "span",
    {
      className: "px-2 py-1 rounded text-xs font-medium text-black",
      style: { backgroundColor: getServerColor(cliente.servidor) }
    },
    cliente.servidor
  )), /* @__PURE__ */ React.createElement("td", { className: "px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell text-sm" }, formatCurrency(cliente.plano_mensal)), /* @__PURE__ */ React.createElement("td", { className: "px-2 sm:px-4 py-2 sm:py-3 text-sm" }, formatDate(cliente.data_vencimento)), /* @__PURE__ */ React.createElement("td", { className: "px-2 sm:px-4 py-2 sm:py-3" }, /* @__PURE__ */ React.createElement("span", { className: `px-2 py-1 rounded text-xs ${cliente.status === "Ativo" ? "bg-green-600" : "bg-red-600"}` }, cliente.status)), /* @__PURE__ */ React.createElement("td", { className: "px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm" }, calculateDiasAtivos(cliente.data_vencimento))), /* @__PURE__ */ React.createElement("td", { className: "px-2 sm:px-4 py-2 sm:py-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1 justify-center sm:justify-start" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => addMonths(cliente, 1),
      className: "text-green-400 hover:text-green-300 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded font-medium",
      title: "Adicionar 1 m\xEAs"
    },
    "+1"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => addMonths(cliente, 3),
      className: "text-green-400 hover:text-green-300 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded font-medium",
      title: "Adicionar 3 meses"
    },
    "+3"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setEditingClient(cliente);
        setClientForm({
          nome: cliente.nome,
          telefone: cliente.telefone.replace("+55", ""),
          servidor: cliente.servidor,
          plano_mensal: cliente.plano_mensal.toString(),
          plano_trimestral: cliente.plano_trimestral.toString(),
          data_vencimento: cliente.data_vencimento,
          observacoes: cliente.observacoes || ""
        });
        setShowClientForm(true);
      },
      className: "text-blue-400 hover:text-blue-300 bg-gray-700 hover:bg-gray-600 p-1.5 rounded",
      title: "Editar"
    },
    /* @__PURE__ */ React.createElement(Edit, { className: "w-3 h-3 sm:w-4 sm:h-4" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => deleteClient(cliente.id),
      className: "text-red-400 hover:text-red-300 bg-gray-700 hover:bg-gray-600 p-1.5 rounded",
      title: "Excluir"
    },
    /* @__PURE__ */ React.createElement(Trash2, { className: "w-3 h-3 sm:w-4 sm:h-4" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => sendWhatsAppMessage(cliente),
      className: "text-green-400 hover:text-green-300 bg-gray-700 hover:bg-gray-600 p-1.5 rounded",
      title: "Enviar WhatsApp"
    },
    /* @__PURE__ */ React.createElement(MessageCircle, { className: "w-3 h-3 sm:w-4 sm:h-4" })
  )))))))))) : (
    /* Client Form */
    /* @__PURE__ */ React.createElement("div", { className: "bg-gray-800 rounded-lg p-4 sm:p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-6" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold" }, editingClient ? "Editar Cliente" : "Novo Cliente"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setShowClientForm(false);
          setEditingClient(null);
          setClientForm({
            nome: "",
            telefone: "",
            servidor: "P2X",
            plano_mensal: "",
            plano_trimestral: "",
            data_vencimento: "",
            observacoes: ""
          });
        },
        className: "text-gray-400 hover:text-white"
      },
      "\u2715"
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-2" }, "Nome *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: clientForm.nome,
        onChange: (e) => setClientForm({ ...clientForm, nome: e.target.value }),
        className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
        placeholder: "Orlando Lucas"
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-2" }, "Telefone *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: clientForm.telefone,
        onChange: (e) => setClientForm({ ...clientForm, telefone: e.target.value }),
        className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
        placeholder: "5511999999999"
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-2" }, "Servidor *"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: clientForm.servidor,
        onChange: (e) => setClientForm({ ...clientForm, servidor: e.target.value }),
        className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      },
      servidores.map((servidor) => /* @__PURE__ */ React.createElement("option", { key: servidor, value: servidor }, servidor))
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-2" }, "Data de Vencimento *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        value: clientForm.data_vencimento,
        onChange: (e) => setClientForm({ ...clientForm, data_vencimento: e.target.value }),
        className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-2" }, "Plano Mensal (R$)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        step: "0.01",
        value: clientForm.plano_mensal,
        onChange: (e) => setClientForm({ ...clientForm, plano_mensal: e.target.value }),
        className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
        placeholder: "30.00"
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-2" }, "Plano Trimestral (R$)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        step: "0.01",
        value: clientForm.plano_trimestral,
        onChange: (e) => setClientForm({ ...clientForm, plano_trimestral: e.target.value }),
        className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
        placeholder: "75.00"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "md:col-span-2" }, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-2" }, "Observa\xE7\xF5es"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: clientForm.observacoes,
        onChange: (e) => setClientForm({ ...clientForm, observacoes: e.target.value }),
        rows: 3,
        className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
        placeholder: "Observa\xE7\xF5es sobre o cliente..."
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex space-x-4 mt-6" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: saveClient,
        className: "bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
      },
      editingClient ? "Atualizar Cliente" : "Criar Cliente"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setShowClientForm(false);
          setEditingClient(null);
        },
        className: "bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded"
      },
      "Cancelar"
    )))
  )), activeTab === "logs" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "mb-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold mb-2" }, "Relat\xF3rio de Logs de Recarga"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400" }, "Total de registros: ", logs.length)), /* @__PURE__ */ React.createElement("div", { className: "mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "relative flex-1 sm:flex-none" }, /* @__PURE__ */ React.createElement(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Buscar por cliente...",
      value: logsSearchTerm,
      onChange: (e) => setLogsSearchTerm(e.target.value),
      className: "pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-800 rounded-lg overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-700" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left" }, "Cliente"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left" }, "Servidor"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left" }, "Data Antes"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left" }, "Data Depois"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left" }, "Meses Adicionados"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left" }, "Data da Recarga"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-700" }, logs.filter(
    (log) => log.cliente_nome.toLowerCase().includes(logsSearchTerm.toLowerCase())
  ).length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "6", className: "px-4 py-8 text-center text-gray-400" }, logsSearchTerm ? "Nenhum cliente encontrado com esse nome" : "Nenhum log encontrado")) : logs.filter(
    (log) => log.cliente_nome.toLowerCase().includes(logsSearchTerm.toLowerCase())
  ).map((log) => /* @__PURE__ */ React.createElement("tr", { key: log.id, className: "hover:bg-gray-750" }, /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, log.cliente_nome), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 bg-blue-600 rounded text-xs" }, log.servidor)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, formatDate(log.data_antes)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, formatDate(log.data_depois)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 bg-green-600 rounded text-xs" }, "+", log.meses_adicionados, " m\xEAs", log.meses_adicionados > 1 ? "es" : "")), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, new Date(log.data_recarga).toLocaleDateString("pt-BR"), " \xE0s ", " ", new Date(log.data_recarga).toLocaleTimeString("pt-BR"))))))))), activeTab === "configuracoes" && /* @__PURE__ */ React.createElement("div", { className: "space-y-8" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold" }, "Configura\xE7\xF5es do Sistema"), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-800 rounded-lg p-6" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold mb-4 text-blue-400" }, "Custos dos Servidores"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 mb-4" }, "Configure os custos de cada tipo de servidor para c\xE1lculos de lucro."), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-2" }, "P2X"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.01",
      value: costForm.p2x,
      onChange: (e) => setCostForm({ ...costForm, p2x: parseFloat(e.target.value) }),
      className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-2" }, "P2_SERVER"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.01",
      value: costForm.p2_server,
      onChange: (e) => setCostForm({ ...costForm, p2_server: parseFloat(e.target.value) }),
      className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-2" }, "RTV"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.01",
      value: costForm.rtv,
      onChange: (e) => setCostForm({ ...costForm, rtv: parseFloat(e.target.value) }),
      className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-2" }, "RTV-VODs"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.01",
      value: costForm.rtv_vods,
      onChange: (e) => setCostForm({ ...costForm, rtv_vods: parseFloat(e.target.value) }),
      className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-2" }, "CPLAYER"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.01",
      value: costForm.cplayer,
      onChange: (e) => setCostForm({ ...costForm, cplayer: parseFloat(e.target.value) }),
      className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "mb-6" }, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold mb-3" }, "Resumo dos Custos:"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4 text-sm" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gray-700 p-3 rounded" }, /* @__PURE__ */ React.createElement("div", { className: "text-gray-400" }, "P2X"), /* @__PURE__ */ React.createElement("div", { className: "font-bold text-green-400" }, formatCurrency(costForm.p2x))), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-700 p-3 rounded" }, /* @__PURE__ */ React.createElement("div", { className: "text-gray-400" }, "P2_SERVER"), /* @__PURE__ */ React.createElement("div", { className: "font-bold text-green-400" }, formatCurrency(costForm.p2_server))), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-700 p-3 rounded" }, /* @__PURE__ */ React.createElement("div", { className: "text-gray-400" }, "RTV"), /* @__PURE__ */ React.createElement("div", { className: "font-bold text-green-400" }, formatCurrency(costForm.rtv))), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-700 p-3 rounded" }, /* @__PURE__ */ React.createElement("div", { className: "text-gray-400" }, "RTV-VODs"), /* @__PURE__ */ React.createElement("div", { className: "font-bold text-green-400" }, formatCurrency(costForm.rtv_vods))), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-700 p-3 rounded" }, /* @__PURE__ */ React.createElement("div", { className: "text-gray-400" }, "CPLAYER"), /* @__PURE__ */ React.createElement("div", { className: "font-bold text-green-400" }, formatCurrency(costForm.cplayer))))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: saveCosts,
      className: "bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
    },
    "Salvar Custos"
  )), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-800 rounded-lg p-6" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold mb-4 text-green-400" }, "Configura\xE7\xE3o do WhatsApp"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 mb-4" }, "Personalize as mensagens autom\xE1ticas do sistema usando as vari\xE1veis abaixo:"), /* @__PURE__ */ React.createElement("div", { className: "mb-4" }, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold mb-2" }, "Vari\xE1veis Dispon\xEDveis:"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "bg-blue-600 px-2 py-1 rounded" }, "{nome}"), /* @__PURE__ */ React.createElement("span", { className: "bg-blue-600 px-2 py-1 rounded" }, "{servidor}"), /* @__PURE__ */ React.createElement("span", { className: "bg-blue-600 px-2 py-1 rounded" }, "{plano_mensal}"), /* @__PURE__ */ React.createElement("span", { className: "bg-blue-600 px-2 py-1 rounded" }, "{plano_trimestral}"), /* @__PURE__ */ React.createElement("span", { className: "bg-blue-600 px-2 py-1 rounded" }, "{data_vencimento}"), /* @__PURE__ */ React.createElement("span", { className: "bg-blue-600 px-2 py-1 rounded" }, "{dias_vencimento}"), /* @__PURE__ */ React.createElement("span", { className: "bg-blue-600 px-2 py-1 rounded" }, "{status_vencimento}"))), /* @__PURE__ */ React.createElement("div", { className: "mb-4" }, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-2" }, "Mensagem Padr\xE3o"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: configWhatsApp,
      onChange: (e) => setConfigWhatsApp(e.target.value),
      rows: 6,
      className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
      placeholder: "Escreva sua mensagem aqui..."
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "mb-6" }, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold mb-2" }, "Preview da Mensagem:"), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-700 p-4 rounded border-l-4 border-green-500" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-300 whitespace-pre-line" }, configWhatsApp.replace("{nome}", "Jo\xE3o da Silva").replace("{servidor}", "P2X").replace("{plano_mensal}", "R$ 30,00").replace("{plano_trimestral}", "R$ 75,00").replace("{data_vencimento}", "15/09/2025").replace("{dias_vencimento}", "5").replace("{status_vencimento}", "Ativo")))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: saveWhatsAppConfig,
      className: "bg-green-600 hover:bg-green-700 px-6 py-2 rounded"
    },
    "Salvar Configura\xE7\xE3o"
  )))));
};
var stdin_default = SistemaGestaoClientes;
export {
  stdin_default as default
};
