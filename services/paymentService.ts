import { MERCADO_PAGO_ACCESS_TOKEN } from './mockFirebase';

export interface PixResponse {
  id: number;
  qr_code: string;
  qr_code_base64: string;
  status: string;
}

// Production-ready Payment Service
export const paymentService = {
  /**
   * Creates a payment preference/intent directly with Mercado Pago.
   * STRICT MODE: No mocks. Real PIX generation.
   */
  async createPixPayment(
    amount: number, 
    description: string, 
    userEmail: string, 
    userName: string, 
    userCpf: string
  ): Promise<PixResponse> {
    
    // 1. Sanitize Data
    // Remove tudo que não for dígito do CPF
    const cleanCpf = (userCpf || "").replace(/\D/g, '');
    
    // Validação básica de CPF para evitar rejeição imediata da API
    const validCpf = cleanCpf.length === 11 ? cleanCpf : null;
    
    // Nome split
    const names = (userName || "Usuario").trim().split(' ');
    const firstName = names[0];
    const lastName = names.length > 1 ? names.slice(1).join(' ') : "App";

    // Email fallback
    const validEmail = (userEmail && userEmail.includes('@')) ? userEmail.trim() : "user@trocatroca.app";

    // Se não tiver CPF válido, a API do Mercado Pago VAI rejeitar PIX.
    // Nesse caso, lançamos erro antes de chamar.
    if (!validCpf) {
        throw new Error("CPF inválido ou não cadastrado. Atualize seu perfil para gerar o PIX.");
    }

    const payload = {
      transaction_amount: Number(amount.toFixed(2)),
      description: description.substring(0, 60),
      payment_method_id: 'pix',
      payer: {
        email: validEmail,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'CPF',
          number: validCpf
        }
      },
      // Notification URL é opcional se você estiver fazendo polling no frontend, 
      // mas recomendada se tiver backend.
      notification_url: "https://api.trocatroca.app/webhooks/mercadopago" 
    };

    try {
      console.log("🔒 [PIX REAL] Iniciando transação com Mercado Pago...", { amount, cpf: validCpf });

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Erro API Mercado Pago:", data);
        
        // Tratamento de erros comuns
        if (data.message && data.message.includes("identification")) {
            throw new Error("O CPF informado é inválido para o Mercado Pago.");
        }
        if (data.status === 401) {
            throw new Error("Erro de Configuração: Token de Acesso Inválido no Painel.");
        }
        
        throw new Error(data.message || "Não foi possível gerar o PIX. Tente novamente mais tarde.");
      }
      
      // SUCESSO REAL
      return {
        id: data.id,
        qr_code: data.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
        status: data.status
      };

    } catch (error: any) {
      console.error("Payment Service Critical Error:", error);
      // RE-THROW ERROR. Não retornamos mock. A UI deve mostrar o erro.
      throw error;
    }
  },

  async checkPaymentStatus(paymentId: number): Promise<string> {
    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
        }
      });

      if (!response.ok) return 'pending';

      const data = await response.json();
      // console.log(`🔎 Status Pagamento ID ${paymentId}: ${data.status}`);
      return data.status; // approved, pending, rejected
    } catch (e) {
      console.error("Erro ao verificar status:", e);
      return 'pending';
    }
  }
};