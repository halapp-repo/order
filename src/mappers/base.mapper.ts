export abstract class IMapper<TModal, TDto> {
  abstract toDTO(arg: TModal, ...params: any[]): TDto;
  toListDTO(arg: TModal[], ...params: any[]): TDto[] {
    return arg.map((a) => this.toDTO(a, ...params));
  }
  abstract toModel(arg: TDto, ...params: any[]): TModal;
  toListModel(arg: TDto[], ...params: any[]): TModal[] {
    return arg.map((a) => this.toModel(a, ...params));
  }
}
