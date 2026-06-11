export function get_type(obj: any) : string {
    const base_type: string = obj ? typeof obj : 'null'
    const type = base_type === 'object' ? obj.constructor.name : base_type
    return type
}