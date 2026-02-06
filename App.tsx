import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, 
  ScanFace, 
  BarChart3, 
  UserPlus, 
  Trash2, 
  Download, 
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Search,
  Loader2
} from 'lucide-react';
import { CameraComponent } from './components/Camera';
import { StorageService } from './services/storageService';
import { FaceService } from './services/faceService';
import { Member, AttendanceRecord, AppView } from './types';

// --- Components defined internally for simplicity of the single-file output requirement ---

const Navbar = ({ currentView, setView }: { currentView: AppView, setView: (v: AppView) => void }) => {
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Início', icon: BarChart3 },
    { id: AppView.CHECKIN, label: 'Chamada', icon: ScanFace },
    { id: AppView.MEMBERS, label: 'Membros', icon: Users },
    { id: AppView.REPORTS, label: 'Relatórios', icon: Calendar },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-between items-center z-50 md:relative md:border-t-0 md:flex-col md:h-screen md:w-64 md:border-r md:justify-start md:gap-4 md:pt-8">
      <div className="hidden md:block text-xl font-bold text-blue-800 px-4 mb-4">
        Presença Igreja
      </div>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`flex flex-col md:flex-row md:px-4 md:py-3 md:w-full items-center gap-1 md:gap-3 rounded-lg transition-colors ${
            currentView === item.id 
              ? 'text-blue-600 md:bg-blue-50 font-semibold' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <item.icon size={24} />
          <span className="text-xs md:text-sm">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

// --- Views ---

const DashboardView = ({ members, attendance }: { members: Member[], attendance: AttendanceRecord[] }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const presentToday = attendance.filter(r => r.dateStr === todayStr);

  return (
    <div className="p-4 space-y-6 pb-20 md:pb-4">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Painel de Controle</h1>
        <p className="text-gray-500">Bem-vindo ao sistema de presença.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Membros</p>
          <p className="text-3xl font-bold text-blue-600">{members.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Presentes Hoje</p>
          <p className="text-3xl font-bold text-green-600">{presentToday.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-800">Presença Hoje ({todayStr})</h2>
        </div>
        {presentToday.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Ninguém registrado hoje ainda.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {presentToday.map(record => (
              <li key={record.id} className="p-4 flex items-center justify-between">
                <span className="font-medium text-gray-700">{record.memberName}</span>
                <span className="text-sm text-gray-500 font-mono">
                  {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const MembersView = ({ members, onUpdate }: { members: Member[], onUpdate: () => void }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!newName || !newPhoto) return;
    
    setIsProcessing(true);
    try {
      // Extract biometric descriptor from photo
      const descriptor = await FaceService.getDescriptorFromImage(newPhoto);
      
      if (!descriptor) {
        alert("Não foi possível detectar um rosto nítido nesta foto. Por favor, tente novamente com melhor iluminação e o rosto centralizado.");
        setIsProcessing(false);
        return;
      }

      // Convert Float32Array to regular array for JSON storage
      const descriptorArray = Array.from(descriptor);

      const member: Member = {
        id: crypto.randomUUID(),
        name: newName,
        photoUrl: newPhoto,
        faceDescriptor: descriptorArray,
        createdAt: new Date().toISOString()
      };
      
      StorageService.saveMember(member);
      setIsAdding(false);
      setNewName('');
      setNewPhoto(null);
      onUpdate();
    } catch (e) {
      console.error(e);
      alert("Erro ao processar imagem. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (id: string) => {
    StorageService.deleteMember(id);
    setDeleteId(null);
    onUpdate();
  };

  if (isAdding) {
    return (
      <div className="p-4 pb-20 space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Novo Membro</h1>
          <button onClick={() => setIsAdding(false)} className="text-gray-500"><X /></button>
        </header>
        
        <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              placeholder="Ex: João da Silva"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto de Identificação</label>
            {newPhoto ? (
              <div className="relative">
                <img src={newPhoto} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
                <button 
                  onClick={() => setNewPhoto(null)} 
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <CameraComponent active={true} onCapture={setNewPhoto} />
            )}
            <p className="text-xs text-gray-500 mt-2">
              Importante: O sistema analisa a geometria do rosto. Garanta que o rosto esteja bem iluminado e sem acessórios (óculos escuros, máscara).
            </p>
          </div>

          <button 
            onClick={handleSave}
            disabled={!newName || !newPhoto || isProcessing}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isProcessing ? <><Loader2 className="animate-spin" /> Processando Rosto...</> : 'Salvar Membro'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-4 h-full flex flex-col">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Membros</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold shadow-sm active:scale-95 transition-transform"
        >
          <UserPlus size={18} /> Novo
        </button>
      </header>

      <div className="flex-1 overflow-y-auto space-y-3">
        {members.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Users size={48} className="mx-auto mb-2 opacity-20" />
            <p>Nenhum membro cadastrado.</p>
          </div>
        ) : (
          members.map(member => (
            <div key={member.id} className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <img 
                src={member.photoUrl} 
                alt={member.name} 
                className="w-12 h-12 rounded-full object-cover border border-gray-200" 
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{member.name}</h3>
                <p className="text-xs text-gray-400">
                  {member.faceDescriptor ? <span className="text-green-600 flex items-center gap-1"><ScanFace size={10} /> Biometria Ativa</span> : <span className="text-red-400">Sem biometria</span>}
                </p>
              </div>
              
              {deleteId === member.id ? (
                <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-right-4">
                   <button 
                    onClick={() => handleDelete(member.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold shadow-sm"
                  >
                    Confirmar
                  </button>
                  <button 
                    onClick={() => setDeleteId(null)}
                    className="bg-gray-200 text-gray-600 px-3 py-1 rounded text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setDeleteId(member.id)}
                  className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const CheckInView = ({ members, onAttendanceLogged }: { members: Member[], onAttendanceLogged: () => void }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastMatch, setLastMatch] = useState<{name: string, time: string} | null>(null);
  const [status, setStatus] = useState<string>('Aguardando câmera...');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const processVideo = async () => {
      if (!isScanning || !videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      setStatus('Analisando rosto...');
      try {
        const detection = await FaceService.detectFaceInVideo(videoRef.current);
        
        if (detection) {
          const match = FaceService.findMatch(detection.descriptor, members);
          
          if (match) {
             const result = StorageService.logAttendance(match.member);
             if (result) {
               setLastMatch({
                 name: match.member.name,
                 time: new Date().toLocaleTimeString()
               });
               onAttendanceLogged();
               setStatus(`✅ PRESENÇA: ${match.member.name}`);
             } else {
               setStatus(`⚠️ Já registrado: ${match.member.name}`);
             }
          } else {
            setStatus('❓ Rosto desconhecido');
          }
        } else {
          setStatus('Buscando rostos...');
        }
      } catch (err) {
        console.error("Detection error", err);
      }
    };

    if (isScanning) {
      interval = setInterval(processVideo, 500); // Check every 500ms
    }

    return () => clearInterval(interval);
  }, [isScanning, members, onAttendanceLogged]);

  return (
    <div className="p-4 space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Chamada Automática</h1>
        <p className="text-sm text-gray-500">Posicione o celular para reconhecer os membros.</p>
      </header>

      <div className="relative">
        <CameraComponent 
            active={isScanning} 
            onCapture={() => {}} 
            facingMode="environment" 
            onVideoReady={(el) => { videoRef.current = el; }}
        />
        
        {isScanning && (
          <div className="absolute top-4 left-4 right-4 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-center text-sm font-mono animate-pulse transition-all">
            {status}
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 border-2 border-blue-500/30 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-white/50 rounded-lg"></div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => setIsScanning(!isScanning)}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
            isScanning 
              ? 'bg-red-500 text-white shadow-red-200' 
              : 'bg-blue-600 text-white shadow-blue-200'
          }`}
        >
          {isScanning ? 'Parar Reconhecimento' : 'Iniciar Chamada'}
        </button>

        {members.length === 0 && (
           <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-start gap-2 text-sm">
             <AlertCircle size={16} className="mt-0.5" />
             <p>Você precisa cadastrar membros na aba "Membros" antes de iniciar o reconhecimento.</p>
           </div>
        )}

        {lastMatch && (
          <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-green-500 text-white p-2 rounded-full">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Último Registro</p>
              <p className="font-bold text-gray-800 text-lg">{lastMatch.name}</p>
              <p className="text-sm text-gray-500">{lastMatch.time}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ReportsView = ({ attendance, members }: { attendance: AttendanceRecord[], members: Member[] }) => {
  // Date State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Derived State
  const filteredAttendance = attendance.filter(r => r.dateStr === selectedDate);
  
  const exportCSV = () => {
    const headers = ['Nome,Data,Hora,ID Membro'];
    const rows = attendance.map(r => 
      `${r.memberName},${r.dateStr},${new Date(r.timestamp).toLocaleTimeString()},${r.memberId}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `presenca_igreja_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        <p className="text-sm text-gray-500">Histórico de presença por data.</p>
      </header>

      {/* Controls Area */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selecionar Data</label>
          <div className="relative">
             <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
             />
             <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
          </div>
        </div>

        <button 
          onClick={exportCSV}
          className="w-full bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-blue-100 transition-colors"
        >
          <Download size={18} />
          Baixar Planilha Completa (Excel)
        </button>
      </div>

      {/* Results Area */}
      <div className="space-y-2">
         <div className="flex items-center justify-between px-1">
             <h2 className="font-semibold text-gray-800">Lista de Presença</h2>
             <span className="text-sm bg-gray-200 px-2 py-1 rounded-full text-gray-700 font-medium">
               Total: {filteredAttendance.length}
             </span>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[200px]">
           {filteredAttendance.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-48 text-gray-400">
               <Search size={32} className="mb-2 opacity-20" />
               <p>Nenhum registro nesta data.</p>
             </div>
           ) : (
             <div className="divide-y divide-gray-100">
               {filteredAttendance.map(r => (
                 <div key={r.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {r.memberName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-700">{r.memberName}</span>
                    </div>
                    <span className="text-sm font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      {new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                 </div>
               ))}
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
       await FaceService.loadModels();
       setModelsLoaded(true);
       refreshData();
    };
    init();
  }, []);

  const refreshData = useCallback(() => {
    setMembers(StorageService.getMembers());
    setAttendance(StorageService.getAttendance());
  }, []);

  if (!modelsLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p>Carregando inteligência facial...</p>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <DashboardView members={members} attendance={attendance} />;
      case AppView.MEMBERS:
        return <MembersView members={members} onUpdate={refreshData} />;
      case AppView.CHECKIN:
        return <CheckInView members={members} onAttendanceLogged={refreshData} />;
      case AppView.REPORTS:
        return <ReportsView attendance={attendance} members={members} />;
      default:
        return <DashboardView members={members} attendance={attendance} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans text-slate-800">
      <Navbar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 relative overflow-hidden h-screen md:h-auto overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full h-full">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;