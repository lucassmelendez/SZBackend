-- Crear tabla de transacciones pendientes
CREATE TABLE IF NOT EXISTS public.transacciones_pendientes (
    id SERIAL PRIMARY KEY,
    buy_order VARCHAR(50) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    items JSONB NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas por buy_order
CREATE INDEX IF NOT EXISTS idx_transacciones_pendientes_buy_order 
ON public.transacciones_pendientes(buy_order);

-- Crear índice para búsquedas rápidas por session_id
CREATE INDEX IF NOT EXISTS idx_transacciones_pendientes_session_id 
ON public.transacciones_pendientes(session_id);

-- Comentarios para la tabla
COMMENT ON TABLE public.transacciones_pendientes IS 'Tabla para almacenar transacciones pendientes de WebPay';
COMMENT ON COLUMN public.transacciones_pendientes.buy_order IS 'Número de orden de compra';
COMMENT ON COLUMN public.transacciones_pendientes.session_id IS 'ID de sesión';
COMMENT ON COLUMN public.transacciones_pendientes.amount IS 'Monto de la transacción';
COMMENT ON COLUMN public.transacciones_pendientes.items IS 'Productos en formato JSON';
COMMENT ON COLUMN public.transacciones_pendientes.user_id IS 'ID del usuario que realizó la transacción';

-- Configurar permisos de acceso (RLS)
ALTER TABLE public.transacciones_pendientes ENABLE ROW LEVEL SECURITY;

-- Política para permitir a los administradores ver todas las transacciones
CREATE POLICY admin_select_transacciones_pendientes 
ON public.transacciones_pendientes
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE auth.uid() = id AND rol = 'admin'
    )
);

-- Política para permitir a los usuarios ver sus propias transacciones
CREATE POLICY user_select_transacciones_pendientes 
ON public.transacciones_pendientes
FOR SELECT
USING (auth.uid() = user_id);

-- Política para permitir insertar transacciones (para cualquier usuario autenticado)
CREATE POLICY insert_transacciones_pendientes 
ON public.transacciones_pendientes
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir eliminar transacciones (solo para administradores)
CREATE POLICY admin_delete_transacciones_pendientes 
ON public.transacciones_pendientes
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE auth.uid() = id AND rol = 'admin'
    )
); 