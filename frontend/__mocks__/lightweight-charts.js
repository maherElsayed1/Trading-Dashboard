module.exports = {
  createChart: jest.fn(() => ({
    addCandlestickSeries: jest.fn(() => ({
      setData: jest.fn(),
      update: jest.fn(),
    })),
    addLineSeries: jest.fn(() => ({
      setData: jest.fn(),
      update: jest.fn(),
    })),
    addAreaSeries: jest.fn(() => ({
      setData: jest.fn(),
      update: jest.fn(),
    })),
    applyOptions: jest.fn(),
    timeScale: jest.fn(() => ({
      fitContent: jest.fn(),
      setVisibleRange: jest.fn(),
    })),
    remove: jest.fn(),
    resize: jest.fn(),
  })),
  ColorType: {
    Solid: 'Solid',
  },
  CrosshairMode: {
    Normal: 0,
  },
}