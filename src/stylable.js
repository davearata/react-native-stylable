import React, { PropTypes } from 'react'
import hoistStatics from 'hoist-non-react-statics'

import Node from './node'

function getDisplayName (comp) {
  return comp.displayName || comp.name || 'Component'
}

export default function stylable (name) {
  return function wrapWithComponent (WrappedComponent) {
    const stylableDisplayName = `Stylable(${getDisplayName(WrappedComponent)})`

    class Stylable extends React.Component {
      static displayName = stylableDisplayName
      static WrappedComponent = WrappedComponent
      static contextTypes = {
        styleSheet: PropTypes.object.isRequired,
        styleNode: PropTypes.object
      }
      static childContextTypes = {
        styleNode: PropTypes.object.isRequired
      }
      static propTypes = {
        variant: PropTypes.any
      }

      constructor (props, ctx) {
        super(props, ctx)
        this.node = new Node(name, props, ctx.styleNode, ctx.styleSheet)
        this.state = { childProps: this.node.getChildProps() }
        this._wrapped = undefined
      }

      componentWillReceiveProps (nextProps) {
        this.node.setProps(nextProps)
      }

      componentDidMount () {
        this.node.subscribe(this.nodeChanged)
      }

      componentWillUnmount () {
        this.node.dispose()
      }

      nodeChanged = () => {
        this.setState({ childProps: this.node.getChildProps() })
      }

      render () {
        return React.createElement(WrappedComponent, {
          ...this.state.childProps,
          ref: this._setWrappedRef
        })
      }

      _setWrappedRef = (el) => { this._wrapped = el }

      getChildContext () {
        return { styleNode: this.node }
      }
    }

    const proto = WrappedComponent.prototype
    if (typeof proto.setNativeProps === 'function') {
      Stylable.prototype.setNativeProps = function (props) {
        this._wrapped && this._wrapped.setNativeProps(props)
      }
    }

    return hoistStatics(Stylable, WrappedComponent)
  }
}
