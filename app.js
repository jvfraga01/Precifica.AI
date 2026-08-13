       <p class="text-[10px] text-muted mt-1">Giro: ${p.salesGiro}/mês</p>
     </td>
     <td class="p-3 text-right">
        <div class="flex justify-end gap-2">
          <!-- Ícone de Editar -->
          <button onclick="openModal(${p.id})" class="flex items-center gap-1 p-1.5 px-3 rounded-lg bg-secondary border border-theme text-primary-theme font-bold hover:bg-primary-theme hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            Editar
          </button>
          <!-- Ícone de Excluir -->
          <button onclick="deleteProduct(${p.id})" class="flex items-center gap-1 p-1.5 px-3 rounded-lg bg-secondary border border-theme text-destructive-theme font-bold hover:bg-destructive-theme hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            Excluir
          </button>
        </div>
     </td>
   </tr>`;
}).join('');
