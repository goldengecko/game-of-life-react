import React from 'react'
/**
 * The cell class handles both drawing of a cell and handling clicks so they can be passed back up
 * the hierarchy to update the state of the board.
 */
class Cell extends React.Component {
  constructor(props) {
    super(props)

    this.handleCellClicked = this.handleCellClicked.bind(this)
  }

  handleCellClicked() {
    this.props.handleCellClicked(this.props.row, this.props.col)
  }

  render() {
    var dim = this.props.dim
    return (
      <rect
      width={dim} height={dim} fill={this.props.fill}
      stroke='#aaaaaa' strokeWidth='0.5'
      x={dim*this.props.col} y={dim*this.props.row}
      onClick={this.handleCellClicked}>
      </rect>
    )
  }
}

export default Cell