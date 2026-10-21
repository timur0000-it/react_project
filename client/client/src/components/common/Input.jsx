export function Input({value, onChange, placeholder, style = {}}){
    return (
        <input
            type='text'
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid black',
                fontSize: 14,
                boxSizing: 'border-box',
                borderRadius: 6,
                ...style
            }}
        />
    )
}