import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Plus, Download, Upload, Edit, Trash2, MessageCircle, Calendar, Settings, FileText, User, DollarSign } from 'lucide-react';

// Configuração do Supabase
const supabaseUrl = 'https://ivumtyhdkjurerknjnpt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dW10eWhka2p1cmVya25qbnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjUyMjMsImV4cCI6MjA2NTk0MTIyM30.rbkqMbSYczGbJdGSjUvARGLIU3Gf-B9q0RWm0vW99Bs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SistemaGestaoClientes = () => {
  const [activeTab, setActiveTab] = useState('clientes');
  const [clientes, setClientes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [custos, setCustos] = useState({});
  const [configWhatsApp, setConfigWhatsApp] = useState('');
  
  // Estados para filtro de logs
  const [logsSearchTerm, setLogsSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [servidorFilter, setServidorFilter] = useState('Todos');

  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortByDate, setSortByDate] = useState('asc'); // 'asc' = mais próximo primeiro, 'desc' = mais distante primeiro
  const [showOnlyCloseToExpire, setShowOnlyCloseToExpire] = useState(false);

  const [clientForm, setClientForm] = useState({
    nome: '',
    telefone: '',
    servidor: 'P2X',
    plano_mensal: '',
    plano_trimestral: '',
    data_vencimento: '',
    observacoes: ''
  });

  const [costForm, setCostForm] = useState({
    p2x: 8.00,
    p2_server: 10.00,
    rtv: 8.00,
    rtv_vods: 8.00,
    cplayer: 8.00
  });

  const servidores = ['P2X', 'P2_SERVER', 'RTV', 'RTV-VODs', 'CPLAYER'];

  // Funções de formatação
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getServerColor = (servidor) => {
    const colors = {
      'P2X': '#836FFF',           // SlateBlue1
      'P2_SERVER': '#00FFFF',     // Aqua / Cyan
      'CPLAYER': '#87CEEB',       // SkyBlue
      'RTV': '#98FB98',           // PaleGreen
      'RTV-VODs': '#DAA520'       // Goldenrod
    };
    return colors[servidor] || '#3B82F6'; // Azul padrão se não encontrar
  };

  const formatDate = (date) => {
    // Criar data local sem conversão de timezone
    const localDate = new Date(date + 'T00:00:00');
    return localDate.toLocaleDateString('pt-BR');
  };

  const formatPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return `+55${cleaned}`;
  };



  const calculateDaysUntilExpiry = (expiryDate) => {
    // Criar datas locais sem conversão de timezone
    const expiry = new Date(expiryDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Definir como início do dia
    
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateDiasAtivos = (expiryDate) => {
    // Criar datas locais sem conversão de timezone
    const expiry = new Date(expiryDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0) {
      return `Faltam ${diffDays} dias`;
    } else {
      return `Venceu há ${Math.abs(diffDays)} dias`;
    }
  };

  const getStatus = (expiryDate) => {
    // Usar data local para verificar status
    const expiry = new Date(expiryDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return expiry >= today ? 'Ativo' : 'Vencido';
  };

  // Carregar dados
  useEffect(() => {
    loadClientes();
    loadLogs();
    loadCustos();
    loadWhatsAppConfig();
  }, []);



  const loadClientes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gerenciador_clientes')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('Erro ao carregar clientes:', error);
    } else {
      // Usar dados diretos do banco sem modificações
      const clientesWithStatus = data.map(cliente => {
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
    const { data, error } = await supabase
      .from('gerenciador_logs_recarga')
      .select('*')
      .order('data_recarga', { ascending: false });
    
    if (error) {
      console.error('Erro ao carregar logs:', error);
    } else {
      setLogs(data);
    }
  };

  const loadCustos = async () => {
    const { data, error } = await supabase
      .from('gerenciador_custos_servidores')
      .select('*')
      .single();
    
    if (error) {
      console.error('Erro ao carregar custos:', error);
    } else if (data) {
      setCostForm(data);
      setCustos(data);
    }
  };

  const loadWhatsAppConfig = async () => {
    const { data, error } = await supabase
      .from('gerenciador_configuracoes_whatsapp')
      .select('mensagem_padrao')
      .single();
    
    if (error) {
      console.error('Erro ao carregar config WhatsApp:', error);
    } else if (data) {
      setConfigWhatsApp(data.mensagem_padrao);
    }
  };

  // CRUD Clientes
  const saveClient = async () => {
    if (!clientForm.nome || !clientForm.telefone || !clientForm.data_vencimento) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const clientData = {
      nome: clientForm.nome,
      telefone: formatPhone(clientForm.telefone),
      servidor: clientForm.servidor,
      plano_mensal: parseFloat(clientForm.plano_mensal) || 0,
      plano_trimestral: parseFloat(clientForm.plano_trimestral) || 0,
      data_vencimento: clientForm.data_vencimento,
      observacoes: clientForm.observacoes || '',
      status: getStatus(clientForm.data_vencimento)
    };

    let result;
    if (editingClient) {
      // Para edição, incluir o ID
      const updateData = {
        ...clientData,
        id: editingClient.id
      };
      
      result = await supabase
        .from('gerenciador_clientes')
        .update(updateData)
        .eq('id', editingClient.id);
    } else {
      // Para criação, gerar um ID único
      const maxIdResult = await supabase
        .from('gerenciador_clientes')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
      
      let newId = 1;
      if (maxIdResult.data && maxIdResult.data.length > 0) {
        newId = maxIdResult.data[0].id + 1;
      }
      
      const insertData = {
        ...clientData,
        id: newId
      };
      
      result = await supabase
        .from('gerenciador_clientes')
        .insert([insertData]);
    }

    if (result.error) {
      console.error('Erro ao salvar cliente:', result.error);
      alert('Erro ao salvar cliente: ' + result.error.message);
    } else {
      alert(`Cliente ${editingClient ? 'atualizado' : 'criado'} com sucesso!`);
      setShowClientForm(false);
      setEditingClient(null);
      setClientForm({
        nome: '',
        telefone: '',
        servidor: 'P2X',
        plano_mensal: '',
        plano_trimestral: '',
        data_vencimento: '',
        observacoes: ''
      });
      loadClientes();
    }
  };

  const deleteClient = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    const { error } = await supabase
      .from('gerenciador_clientes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir cliente:', error);
      alert('Erro ao excluir cliente');
    } else {
      alert('Cliente excluído com sucesso!');
      loadClientes();
    }
  };

  const addMonths = async (cliente, months) => {
    // Verificar se o cliente está vencido
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentExpiry = new Date(cliente.data_vencimento + 'T00:00:00');
    
    let newExpiry;
    
    if (currentExpiry < today) {
      // Cliente VENCIDO: calcular a partir de HOJE + meses
      newExpiry = new Date(today);
      newExpiry.setMonth(newExpiry.getMonth() + months);
    } else {
      // Cliente ATIVO: calcular a partir da data de vencimento atual + meses
      newExpiry = new Date(currentExpiry);
      newExpiry.setMonth(newExpiry.getMonth() + months);
    }

    // Garantir formato YYYY-MM-DD
    const formattedDate = newExpiry.toISOString().split('T')[0];
    const { error: clientError } = await supabase
      .from('gerenciador_clientes')
      .update({ 
        data_vencimento: formattedDate,
        status: 'Ativo'
      })
      .eq('id', cliente.id);

    if (clientError) {
      console.error('Erro ao adicionar meses:', clientError);
      alert('Erro ao adicionar meses');
      return;
    }

    // Adicionar log
    const { error: logError } = await supabase
      .from('gerenciador_logs_recarga')
      .insert([{
        cliente_id: cliente.id,
        cliente_nome: cliente.nome,
        servidor: cliente.servidor,
        data_antes: cliente.data_vencimento,
        data_depois: formattedDate,
        meses_adicionados: months
      }]);

    if (logError) {
      console.error('Erro ao salvar log:', logError);
    }

    alert(`${months} mês(es) adicionado(s) com sucesso!`);
    loadClientes();
    loadLogs();
  };

  // Salvar configurações
  const saveCosts = async () => {
    const { error } = await supabase
      .from('gerenciador_custos_servidores')
      .update(costForm)
      .eq('id', 1);

    if (error) {
      console.error('Erro ao salvar custos:', error);
      alert('Erro ao salvar custos');
    } else {
      alert('Custos salvos com sucesso!');
      setCustos(costForm);
    }
  };

  const saveWhatsAppConfig = async () => {
    const { error } = await supabase
      .from('gerenciador_configuracoes_whatsapp')
      .update({ mensagem_padrao: configWhatsApp })
      .eq('id', 1);

    if (error) {
      console.error('Erro ao salvar config WhatsApp:', error);
      alert('Erro ao salvar configuração do WhatsApp');
    } else {
      alert('Configuração do WhatsApp salva com sucesso!');
    }
  };

  const sendWhatsAppMessage = (cliente) => {
    let mensagem = configWhatsApp;
    mensagem = mensagem.replace('{nome}', cliente.nome);
    mensagem = mensagem.replace('{servidor}', cliente.servidor);
    mensagem = mensagem.replace('{plano_mensal}', formatCurrency(cliente.plano_mensal));
    mensagem = mensagem.replace('{plano_trimestral}', formatCurrency(cliente.plano_trimestral));
    mensagem = mensagem.replace('{data_vencimento}', formatDate(cliente.data_vencimento));
    mensagem = mensagem.replace('{dias_vencimento}', calculateDaysUntilExpiry(cliente.data_vencimento));
    mensagem = mensagem.replace('{status_vencimento}', cliente.status);

    const whatsappUrl = `https://wa.me/${cliente.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Filtrar e ordenar clientes
  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.telefone.includes(searchTerm) ||
                         cliente.id.toString().includes(searchTerm) ||
                         (cliente.dias_ativo && cliente.dias_ativo.toString().includes(searchTerm));
    
    const matchesStatus = statusFilter === 'Todos' || cliente.status === statusFilter;
    const matchesServidor = servidorFilter === 'Todos' || cliente.servidor === servidorFilter;
    
    // Filtro para clientes próximos do vencimento (3, 4 ou 5 dias)
    let matchesCloseToExpire = true;
    if (showOnlyCloseToExpire) {
      const diasRestantes = calculateDaysUntilExpiry(cliente.data_vencimento);
      matchesCloseToExpire = diasRestantes === 3 || diasRestantes === 4 || diasRestantes === 5;
    }
    
    return matchesSearch && matchesStatus && matchesServidor && matchesCloseToExpire;
  }).sort((a, b) => {
    // Primeira prioridade: Status (Ativos primeiro, Vencidos no final)
    if (a.status === 'Ativo' && b.status === 'Vencido') return -1;
    if (a.status === 'Vencido' && b.status === 'Ativo') return 1;
    
    // Segunda prioridade: Ordenar por data de vencimento dentro do mesmo status
    const dateA = new Date(a.data_vencimento + 'T00:00:00');
    const dateB = new Date(b.data_vencimento + 'T00:00:00');
    
    if (sortByDate === 'asc') {
      return dateA - dateB; // Mais próximo primeiro
    } else {
      return dateB - dateA; // Mais distante primeiro
    }
  });

  // Export/Import CSV functions
  const exportToCSV = () => {
    const csvData = filteredClientes.map(cliente => ({
      'ID': cliente.id,
      'Nome': cliente.nome,
      'Telefone': cliente.telefone,
      'Servidor': cliente.servidor,
      'Plano Mensal': cliente.plano_mensal,
      'Plano Trimestral': cliente.plano_trimestral,
      'Data Vencimento': formatDate(cliente.data_vencimento),
      'Status': cliente.status,
      'Dias Ativo': cliente.dias_ativo,
      'Observações': cliente.observacoes
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-3 sm:p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold">Gestão De Clientes</h1>
          <div className="flex items-center space-x-2">
            <span className="text-green-400 hidden sm:inline">Ricardo Moraes</span>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold">
              R
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-800 p-3 sm:p-4">
        <div className="flex space-x-2 sm:space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('clientes')}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded whitespace-nowrap ${
              activeTab === 'clientes' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-sm sm:text-base">Clientes</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded whitespace-nowrap ${
              activeTab === 'logs' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm sm:text-base hidden sm:inline">Relatório de Logs</span>
            <span className="text-sm sm:text-base sm:hidden">Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded whitespace-nowrap ${
              activeTab === 'configuracoes' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm sm:text-base">Config</span>
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-6">
        {/* Tab: Clientes */}
        {activeTab === 'clientes' && (
          <div>
            {!showClientForm ? (
              <>
                {/* Filters and Actions */}
                <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                  <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
                    <button
                      onClick={() => setShowClientForm(true)}
                      className="flex items-center space-x-1 sm:space-x-2 bg-green-600 hover:bg-green-700 px-3 sm:px-4 py-2 rounded text-sm sm:text-base"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Novo Cliente</span>
                      <span className="sm:hidden">Novo</span>
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="flex items-center space-x-1 sm:space-x-2 bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 py-2 rounded text-sm sm:text-base"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Exportar CSV</span>
                      <span className="sm:hidden">Export</span>
                    </button>
                    <button className="flex items-center space-x-1 sm:space-x-2 bg-gray-600 hover:bg-gray-700 px-3 sm:px-4 py-2 rounded text-sm sm:text-base">
                      <Upload className="w-4 h-4" />
                      <span className="hidden sm:inline">Importar CSV</span>
                      <span className="sm:hidden">Import</span>
                    </button>

                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      />
                    </div>

                    <div className="flex gap-2 sm:gap-4">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 sm:flex-none px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      >
                        <option value="Todos">Todos Status</option>
                        <option value="Ativo">Ativo</option>
                        <option value="Vencido">Vencido</option>
                      </select>

                      <select
                        value={servidorFilter}
                        onChange={(e) => setServidorFilter(e.target.value)}
                        className="flex-1 sm:flex-none px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      >
                        <option value="Todos">Todos Servidores</option>
                        {servidores.map(servidor => (
                          <option key={servidor} value={servidor}>{servidor}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Filtro para clientes próximos do vencimento */}
                  <div className="flex items-center">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOnlyCloseToExpire}
                        onChange={(e) => setShowOnlyCloseToExpire(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm sm:text-base text-white">
                        Mostrar apenas clientes próximos do vencimento (3, 4, 5 dias)
                      </span>
                    </label>
                  </div>

                </div>

                  {/* Resumo dos Clientes */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <div className="bg-green-600 p-3 sm:p-4 rounded-lg text-center">
                      <div className="text-xl sm:text-2xl font-bold">{filteredClientes.filter(c => c.status === 'Ativo').length}</div>
                      <div className="text-xs sm:text-sm">Clientes Ativos</div>
                      <div className="text-xs opacity-75">
                        {formatCurrency(filteredClientes.filter(c => c.status === 'Ativo').reduce((sum, c) => sum + (c.plano_mensal || 0), 0))}
                      </div>
                    </div>
                    <div className="bg-red-600 p-3 sm:p-4 rounded-lg text-center">
                      <div className="text-xl sm:text-2xl font-bold">{filteredClientes.filter(c => c.status === 'Vencido').length}</div>
                      <div className="text-xs sm:text-sm">Clientes Vencidos</div>
                      <div className="text-xs opacity-75">
                        {formatCurrency(filteredClientes.filter(c => c.status === 'Vencido').reduce((sum, c) => sum + (c.plano_mensal || 0), 0))}
                      </div>
                    </div>
                    <div className="bg-blue-600 p-3 sm:p-4 rounded-lg text-center">
                      <div className="text-xl sm:text-2xl font-bold">{filteredClientes.length}</div>
                      <div className="text-xs sm:text-sm">Total de Clientes</div>
                      <div className="text-xs opacity-75">
                        {formatCurrency(filteredClientes.reduce((sum, c) => sum + (c.plano_mensal || 0), 0))}
                      </div>
                    </div>
                    <div className="bg-purple-600 p-3 sm:p-4 rounded-lg text-center">
                      <div className="text-xl sm:text-2xl font-bold">
                        {((filteredClientes.filter(c => c.status === 'Ativo').length / filteredClientes.length) * 100 || 0).toFixed(1)}%
                      </div>
                      <div className="text-xs sm:text-sm">Taxa de Ativos</div>
                      <div className="text-xs opacity-75">Percentual ativo</div>
                    </div>
                  </div>

                {/* Clients Table */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Nome</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm hidden sm:table-cell">Telefone</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Servidor</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm hidden md:table-cell">Plano Mensal</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <span>Vencimento</span>
                              <button
                                onClick={() => setSortByDate(sortByDate === 'asc' ? 'desc' : 'asc')}
                                className="text-gray-400 hover:text-white text-xs bg-gray-600 hover:bg-gray-500 px-1 sm:px-2 py-1 rounded"
                                title={sortByDate === 'asc' ? 'Ordenar por mais distante' : 'Ordenar por mais próximo'}
                              >
                                {sortByDate === 'asc' ? '↑ A-Z' : '↓ Z-A'}
                              </button>
                            </div>
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Status</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm hidden lg:table-cell">Dias Ativo</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {loading ? (
                          <tr>
                            <td colSpan="8" className="px-4 py-8 text-center">
                              Carregando...
                            </td>
                          </tr>
                        ) : filteredClientes.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                              Nenhum cliente encontrado
                            </td>
                          </tr>
                        ) : (
                          filteredClientes.map(cliente => (
                            <tr key={cliente.id} className="hover:bg-gray-750">
                              <td className="px-2 sm:px-4 py-2 sm:py-3">
                                <div className="text-sm sm:text-base font-medium">{cliente.nome}</div>
                                <div className="text-xs text-gray-400 sm:hidden">{cliente.telefone}</div>
                                <div className="text-xs text-gray-400 md:hidden">{formatCurrency(cliente.plano_mensal)}</div>
                                <div className="text-xs text-gray-400 lg:hidden">{calculateDiasAtivos(cliente.data_vencimento)}</div>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell text-sm">{cliente.telefone}</td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3">
                                <span 
                                  className="px-2 py-1 rounded text-xs font-medium text-black"
                                  style={{ backgroundColor: getServerColor(cliente.servidor) }}
                                >
                                  {cliente.servidor}
                                </span>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell text-sm">{formatCurrency(cliente.plano_mensal)}</td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-sm">{formatDate(cliente.data_vencimento)}</td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  cliente.status === 'Ativo' ? 'bg-green-600' : 'bg-red-600'
                                }`}>
                                  {cliente.status}
                                </span>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                                <div className="text-sm">
                                  {calculateDiasAtivos(cliente.data_vencimento)}
                                </div>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3">
                                <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                                  {/* Botões de adicionar meses */}
                                  <button
                                    onClick={() => addMonths(cliente, 1)}
                                    className="text-green-400 hover:text-green-300 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded font-medium"
                                    title="Adicionar 1 mês"
                                  >
                                    +1
                                  </button>
                                  <button
                                    onClick={() => addMonths(cliente, 3)}
                                    className="text-green-400 hover:text-green-300 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded font-medium"
                                    title="Adicionar 3 meses"
                                  >
                                    +3
                                  </button>
                                  
                                  {/* Botões de ação */}
                                  <button
                                    onClick={() => {
                                      setEditingClient(cliente);
                                      setClientForm({
                                        nome: cliente.nome,
                                        telefone: cliente.telefone.replace('+55', ''),
                                        servidor: cliente.servidor,
                                        plano_mensal: cliente.plano_mensal.toString(),
                                        plano_trimestral: cliente.plano_trimestral.toString(),
                                        data_vencimento: cliente.data_vencimento,
                                        observacoes: cliente.observacoes || ''
                                      });
                                      setShowClientForm(true);
                                    }}
                                    className="text-blue-400 hover:text-blue-300 bg-gray-700 hover:bg-gray-600 p-1.5 rounded"
                                    title="Editar"
                                  >
                                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => deleteClient(cliente.id)}
                                    className="text-red-400 hover:text-red-300 bg-gray-700 hover:bg-gray-600 p-1.5 rounded"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => sendWhatsAppMessage(cliente)}
                                    className="text-green-400 hover:text-green-300 bg-gray-700 hover:bg-gray-600 p-1.5 rounded"
                                    title="Enviar WhatsApp"
                                  >
                                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              /* Client Form */
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">
                    {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowClientForm(false);
                      setEditingClient(null);
                      setClientForm({
                        nome: '',
                        telefone: '',
                        servidor: 'P2X',
                        plano_mensal: '',
                        plano_trimestral: '',
                        data_vencimento: '',
                        observacoes: ''
                      });
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome *</label>
                    <input
                      type="text"
                      value={clientForm.nome}
                      onChange={(e) => setClientForm({ ...clientForm, nome: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Orlando Lucas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone *</label>
                    <input
                      type="text"
                      value={clientForm.telefone}
                      onChange={(e) => setClientForm({ ...clientForm, telefone: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="5511999999999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Servidor *</label>
                    <select
                      value={clientForm.servidor}
                      onChange={(e) => setClientForm({ ...clientForm, servidor: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {servidores.map(servidor => (
                        <option key={servidor} value={servidor}>{servidor}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Data de Vencimento *</label>
                    <input
                      type="date"
                      value={clientForm.data_vencimento}
                      onChange={(e) => setClientForm({ ...clientForm, data_vencimento: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Plano Mensal (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={clientForm.plano_mensal}
                      onChange={(e) => setClientForm({ ...clientForm, plano_mensal: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="30.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Plano Trimestral (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={clientForm.plano_trimestral}
                      onChange={(e) => setClientForm({ ...clientForm, plano_trimestral: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="75.00"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Observações</label>
                    <textarea
                      value={clientForm.observacoes}
                      onChange={(e) => setClientForm({ ...clientForm, observacoes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Observações sobre o cliente..."
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={saveClient}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
                  >
                    {editingClient ? 'Atualizar Cliente' : 'Criar Cliente'}
                  </button>
                  <button
                    onClick={() => {
                      setShowClientForm(false);
                      setEditingClient(null);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Logs */}
        {activeTab === 'logs' && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Relatório de Logs de Recarga</h2>
              <p className="text-gray-400">Total de registros: {logs.length}</p>
            </div>
            
            {/* Filtro de busca para logs */}
            <div className="mb-4">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente..."
                  value={logsSearchTerm}
                  onChange={(e) => setLogsSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Servidor</th>
                      <th className="px-4 py-3 text-left">Data Antes</th>
                      <th className="px-4 py-3 text-left">Data Depois</th>
                      <th className="px-4 py-3 text-left">Meses Adicionados</th>
                      <th className="px-4 py-3 text-left">Data da Recarga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {logs.filter(log => 
                      log.cliente_nome.toLowerCase().includes(logsSearchTerm.toLowerCase())
                    ).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                          {logsSearchTerm ? 'Nenhum cliente encontrado com esse nome' : 'Nenhum log encontrado'}
                        </td>
                      </tr>
                    ) : (
                      logs.filter(log => 
                        log.cliente_nome.toLowerCase().includes(logsSearchTerm.toLowerCase())
                      ).map(log => (
                        <tr key={log.id} className="hover:bg-gray-750">
                          <td className="px-4 py-3">{log.cliente_nome}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-blue-600 rounded text-xs">
                              {log.servidor}
                            </span>
                          </td>
                          <td className="px-4 py-3">{formatDate(log.data_antes)}</td>
                          <td className="px-4 py-3">{formatDate(log.data_depois)}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-green-600 rounded text-xs">
                              +{log.meses_adicionados} mês{log.meses_adicionados > 1 ? 'es' : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {new Date(log.data_recarga).toLocaleDateString('pt-BR')} às {' '}
                            {new Date(log.data_recarga).toLocaleTimeString('pt-BR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Configurações */}
        {activeTab === 'configuracoes' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold">Configurações do Sistema</h2>

            {/* Custos dos Servidores */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-blue-400">Custos dos Servidores</h3>
              <p className="text-gray-400 mb-4">Configure os custos de cada tipo de servidor para cálculos de lucro.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">P2X</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costForm.p2x}
                    onChange={(e) => setCostForm({ ...costForm, p2x: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">P2_SERVER</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costForm.p2_server}
                    onChange={(e) => setCostForm({ ...costForm, p2_server: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">RTV</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costForm.rtv}
                    onChange={(e) => setCostForm({ ...costForm, rtv: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">RTV-VODs</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costForm.rtv_vods}
                    onChange={(e) => setCostForm({ ...costForm, rtv_vods: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CPLAYER</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costForm.cplayer}
                    onChange={(e) => setCostForm({ ...costForm, cplayer: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-3">Resumo dos Custos:</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400">P2X</div>
                    <div className="font-bold text-green-400">{formatCurrency(costForm.p2x)}</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400">P2_SERVER</div>
                    <div className="font-bold text-green-400">{formatCurrency(costForm.p2_server)}</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400">RTV</div>
                    <div className="font-bold text-green-400">{formatCurrency(costForm.rtv)}</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400">RTV-VODs</div>
                    <div className="font-bold text-green-400">{formatCurrency(costForm.rtv_vods)}</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400">CPLAYER</div>
                    <div className="font-bold text-green-400">{formatCurrency(costForm.cplayer)}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={saveCosts}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
              >
                Salvar Custos
              </button>
            </div>

            {/* Configuração do WhatsApp */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-green-400">Configuração do WhatsApp</h3>
              <p className="text-gray-400 mb-4">Personalize as mensagens automáticas do sistema usando as variáveis abaixo:</p>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">Variáveis Disponíveis:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <span className="bg-blue-600 px-2 py-1 rounded">{'{nome}'}</span>
                  <span className="bg-blue-600 px-2 py-1 rounded">{'{servidor}'}</span>
                  <span className="bg-blue-600 px-2 py-1 rounded">{'{plano_mensal}'}</span>
                  <span className="bg-blue-600 px-2 py-1 rounded">{'{plano_trimestral}'}</span>
                  <span className="bg-blue-600 px-2 py-1 rounded">{'{data_vencimento}'}</span>
                  <span className="bg-blue-600 px-2 py-1 rounded">{'{dias_vencimento}'}</span>
                  <span className="bg-blue-600 px-2 py-1 rounded">{'{status_vencimento}'}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Mensagem Padrão</label>
                <textarea
                  value={configWhatsApp}
                  onChange={(e) => setConfigWhatsApp(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Escreva sua mensagem aqui..."
                />
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-2">Preview da Mensagem:</h4>
                <div className="bg-gray-700 p-4 rounded border-l-4 border-green-500">
                  <div className="text-sm text-gray-300 whitespace-pre-line">
                    {configWhatsApp
                      .replace('{nome}', 'João da Silva')
                      .replace('{servidor}', 'P2X')
                      .replace('{plano_mensal}', 'R$ 30,00')
                      .replace('{plano_trimestral}', 'R$ 75,00')
                      .replace('{data_vencimento}', '15/09/2025')
                      .replace('{dias_vencimento}', '5')
                      .replace('{status_vencimento}', 'Ativo')
                    }
                  </div>
                </div>
              </div>

              <button
                onClick={saveWhatsAppConfig}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded"
              >
                Salvar Configuração
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SistemaGestaoClientes;