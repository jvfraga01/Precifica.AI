# Precifica.IA

Sistema de gestão inteligente para precificação no setor varejista. O objetivo da aplicação é auxiliar gestores na tomada de decisão através de análise de margens, controle de validade e monitoramento de índices inflacionários (IPCA).

## Funcionalidades

* **Gestão de Produtos:** Cadastro de itens, controle de giro mensal e atualização de precificação com base em custos de aquisição.
* **Inteligência de Precificação:** Cálculo de sugestão de preço baseada em metas de margem e urgência de venda (validade).
* **Análise de Margens:** Relatórios executivos sobre o desempenho comercial e perdas evitadas.
* **Monitoramento Econômico:** Painel dedicado para acompanhamento do IPCA no grupo de Alimentação e Bebidas.
* **Persistência de Dados:** Uso de *LocalStorage* para armazenamento local de produtos e preferências de usuário.

## Estrutura do Projeto

* `index.html`: Dashboard principal com indicadores de desempenho.
* `produtos.html`: Catálogo de produtos e CRUD de itens.
* `analytics.html`: Gráficos de projeção e performance (via *Chart.js*).
* `alertas.html`: Monitoramento de insumos e inflação.
* `app.js`: Regras de negócio, cálculos de precificação e manipulação do DOM.
* `style.css`: Estilização baseada em *Tailwind CSS*.

## Tecnologias

* **Front-end:** HTML5, CSS3, JavaScript (ES6+).
* **Estilização:** Tailwind CSS.
* **Gráficos:** Chart.js.
* **Autenticação:** Simulação de rotas protegidas por *session/local storage*.

## Como Utilizar

1. Clone o repositório:
   ```bash
   git clone [https://github.com/jvfraga01/Projeto-Appjam.git]
2. Abra o projeto no VS Code e utilize a extensão *Live Server* para rodar a aplicação localmente:
   * Clique com o botão direito no arquivo `login.html`.
   * Selecione "Open with Live Server".
3. Utilize as credenciais de acesso para testes:
   * **E-mail:** `gestor@supermercado.com.br`
   * **Senha:** `123456`
