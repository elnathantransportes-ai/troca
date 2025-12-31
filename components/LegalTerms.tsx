import React from 'react';

interface LegalTermsProps {
  onClose: () => void;
}

const LegalTerms: React.FC<LegalTermsProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 relative">
        
        {/* Header */}
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Documentação Jurídica</h3>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">Versão Oficial 2025.1</p>
          </div>
          <button onClick={onClose} className="bg-slate-200 text-slate-500 hover:text-slate-800 transition p-2 hover:bg-slate-300 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 text-sm text-slate-700 leading-relaxed custom-scrollbar bg-white">
          <div className="space-y-8">
            <div className="text-center space-y-3 mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight">
                TERMOS DE USO, RESPONSABILIDADE E POLÍTICA DE PRIVACIDADE
              </h2>
              <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 inline-block px-3 py-1 rounded-md uppercase tracking-wide">
                📅 Última atualização: 19 de dezembro de 2025
              </span>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-amber-900 text-xs font-medium">
              <p className="font-bold mb-1">⚠️ IMPORTANTE:</p>
              Ao realizar o cadastro, acessar ou utilizar o aplicativo TROCA TROCA, o usuário declara que leu, compreendeu e concorda integralmente com estes termos.
            </div>

            <section className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-base border-b border-slate-100 pb-1">1. DO OBJETO E FINALIDADE</h4>
              <p>1.1. O TROCA TROCA é uma plataforma digital que tem como finalidade permitir a divulgação de anúncios e aproximar usuários interessados em realizar trocas de produtos, com ou sem complemento financeiro, negociadas diretamente entre os usuários.</p>
              <p>1.2. O aplicativo atua exclusivamente como intermediador tecnológico, fornecendo ferramentas digitais para publicação de anúncios, visualização de vídeos, envio de propostas, avaliações e comunicação entre usuários.</p>
              <p>1.3. O TROCA TROCA não é vendedor, comprador, intermediador comercial, corretor, agente financeiro, garantidor ou depositário, não participando, em nenhuma hipótese, das negociações realizadas entre os usuários.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-base border-b border-slate-100 pb-1">2. DA ACEITAÇÃO E VALIDADE JURÍDICA</h4>
              <p>2.1. O aceite eletrônico destes termos, por meio da marcação da opção “Li e aceito os Termos de Uso e a Política de Privacidade”, possui plena validade jurídica, nos termos do artigo 107 do Código Civil Brasileiro e da legislação aplicável ao meio eletrônico.</p>
              <p>2.2. O uso continuado do aplicativo após eventuais atualizações destes termos implicará aceite automático das novas condições.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-base border-b border-slate-100 pb-1">3. DO CADASTRO E ELEGIBILIDADE</h4>
              <p>3.1. O uso do aplicativo é permitido apenas a pessoas físicas maiores de 18 anos, legalmente capazes.</p>
              <p>3.2. Para criar uma conta, o usuário deverá fornecer dados verdadeiros, completos e atualizados, incluindo, mas não se limitando a: Nome completo, CPF, E-mail, Telefone / WhatsApp, Data de nascimento, Região (bairro, cidade e estado), Foto de documento oficial (RG ou CNH) e Criação de senha pessoal.</p>
              <p>3.3. O usuário declara, sob as penas da lei, que todas as informações prestadas são verídicas, sendo inteiramente responsável por sua exatidão.</p>
              <p>3.4. O fornecimento de dados falsos, incompletos ou fraudulentos autoriza o TROCA TROCA a suspender ou excluir definitivamente a conta, sem aviso prévio e sem direito a indenização.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-base border-b border-slate-100 pb-1">4. DA CONTA DO USUÁRIO</h4>
              <p>4.1. A conta é pessoal, individual e intransferível.</p>
              <p>4.2. O usuário é o único responsável pela guarda de seu login e senha, respondendo por todas as ações realizadas em sua conta.</p>
              <p>4.3. O e-mail e o CPF são imutáveis, por razões de segurança e conformidade legal.</p>
              <p>4.4. O TROCA TROCA não se responsabiliza por acessos indevidos decorrentes de negligência do usuário.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-base border-b border-slate-100 pb-1">5. DOS ANÚNCIOS E CONTEÚDOS</h4>
              <p>5.1. Os anúncios no aplicativo são obrigatoriamente compostos por vídeo, com duração máxima de 35 (trinta e cinco) segundos, podendo ser gravado no próprio aplicativo ou enviado da galeria do usuário.</p>
              <p>5.2. É expressamente proibido: Informar telefone, endereço ou contatos externos no vídeo; Anunciar armas, drogas, produtos ilícitos ou de origem criminosa; Publicar conteúdo pornográfico, obsceno, violento ou ofensivo; Veicular imagens impróprias, discriminatórias ou contrárias à lei.</p>
              <p>5.3. O usuário é integralmente responsável pelo conteúdo publicado, inclusive pelas informações sobre o produto, estado de conservação, valor médio e interesse de troca.</p>
              <p>5.4. O envio do anúncio implica ciência de que o conteúdo será submetido à análise e aprovação do Painel de Controle (Moderação) antes de ser exibido ao público no EXPLORE.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-base border-b border-slate-100 pb-1">6. DA MODERAÇÃO E DO PAINEL DE CONTROLE</h4>
              <p>6.1. O TROCA TROCA reserva-se o direito de analisar, aprovar, reprovar, suspender ou excluir anúncios e contas, a seu exclusivo critério, sempre que identificar violação destes termos ou da legislação vigente.</p>
              <p>6.2. Conteúdos reprovados não serão exibidos ao público.</p>
              <p>6.3. A exclusão de conta por infração grave é definitiva e irreversível, sem direito a reembolso de valores pagos.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-base border-b border-slate-100 pb-1">7. DA NEGOCIAÇÃO ENTRE USUÁRIOS</h4>
              <p>7.1. As negociações realizadas por meio do aplicativo ocorrem exclusivamente entre os usuários, por conta e risco das partes envolvidas.</p>
              <p>7.2. O desbloqueio de dados pessoal (telefone, chat e informações completas) somente ocorrerá após o aceite da proposta, mediante: Pagamento de taxa simbólica, quando aplicável; ou Isenção automática para usuários do Plano PREMIUM.</p>
              <p>7.3. O TROCA TROCA não participa, não acompanha e não se responsabiliza por negociações, pagamentos, entregas, trocas, inadimplementos ou conflitos entre usuários.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-base border-b border-slate-100 pb-1">8. DOS PLANOS, TAXAS E PAGAMENTOS</h4>
              <p>8.1. O aplicativo poderá cobrar valores por serviços opcionais, incluindo, mas não se limitando a: Destaque de anúncios, Taxa de desbloqueio de negociação e Assinatura do Plano PREMIUM.</p>
              <p>8.2. Os pagamentos são processados por plataformas terceiras, como o Mercado Pago, não sendo armazenados dados bancários pelo TROCA TROCA.</p>
              <p>8.3. Valores pagos não são reembolsáveis, salvo disposição legal em contrário.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-base border-b border-slate-100 pb-1">9. DAS AVALIAÇÕES, DESAFIO E OPINIÕES</h4>
              <p>9.1. As avaliações por estrelas e comentários representam opiniões pessoais dos usuários, não refletindo necessariamente a posição do TROCA TROCA.</p>
              <p>9.2. O aplicativo poderá remover avaliações fraudulentas, abusivas ou manipuladas.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-base border-b border-slate-100 pb-1">10. DA ISENÇÃO DE RESPONSABILIDADE</h4>
              <p>10.1. O usuário concorda que o TROCA TROCA não será responsável, em nenhuma hipótese, por: Danos materiais ou morais, Prejuízos financeiros, Golpes, fraudes ou má-fé de terceiros, Qualidade, origem ou entrega dos produtos.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-base border-b border-slate-100 pb-1">11. DA PROTEÇÃO DE DADOS – LGPD</h4>
              <p>11.1. Os dados pessoais são tratados conforme a Lei Geral de Proteção de Dados – LGPD (Lei nº 13.709/2018).</p>
              <p>11.2. Os dados são utilizados para: Gestão da conta, Funcionamento das funcionalidades do app, Segurança, prevenção a fraudes e cumprimento legal.</p>
              <p>11.3. O usuário poderá solicitar informações, correções ou exclusão de dados, nos limites legais.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-base border-b border-slate-100 pb-1">12. DA EXCLUSÃO E ENCERRAMENTO DA CONTA</h4>
              <p>12.1. O usuário poderá solicitar o encerramento de sua conta a qualquer momento.</p>
              <p>12.2. O TROCA TROCA poderá encerrar contas que violem estes termos, sem necessidade de aviso prévio.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-base border-b border-slate-100 pb-1">13. DA LEGISLAÇÃO E FORO</h4>
              <p>13.1. Estes Termos são regidos pelas leis da República Federativa do Brasil, especialmente: Marco Civil da Internet (Lei nº 12.965/2014), Código Civil Brasileiro e Lei Geral de Proteção de Dados – LGPD.</p>
              <p>13.2. Fica eleito o foro da comarca do domicílio do operador do aplicativo, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50 flex flex-col gap-3 sticky bottom-0 z-10">
          <button 
            onClick={onClose} 
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl transition-all active:scale-[0.98]"
          >
            Fechar e Aceitar
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default LegalTerms;