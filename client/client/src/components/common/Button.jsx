export function Button({children, onClick, variant = 'primary', style = {}}) {
    const styles = {
        primary: {background: '#007bff', color: '#fff'},
        secondary: {background: '#6c757d', color: '#fff'},
        danger: {background: '#dc3545', color: '#fff'},
    }

    return (
        <button
            onClick={onClick}
            style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                ...styles[variant],
                ...style,
            }}  
        >
            {children}
        </button>
    )
}