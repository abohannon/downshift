import React from 'react'
import {render, Simulate} from 'react-testing-library'
import Downshift from '../'

jest.useFakeTimers()

test('space on button opens and closes the menu', () => {
  const {button, renderSpy} = setup()
  Simulate.keyDown(button, {key: ' '})
  expect(renderSpy).toHaveBeenLastCalledWith(
    expect.objectContaining({isOpen: true}),
  )
  Simulate.keyDown(button, {key: ' '})
  expect(renderSpy).toHaveBeenLastCalledWith(
    expect.objectContaining({isOpen: false}),
  )
})

test('clicking on the button opens and closes the menu', () => {
  const {button, renderSpy} = setup()
  Simulate.click(button)
  expect(renderSpy).toHaveBeenLastCalledWith(
    expect.objectContaining({isOpen: true}),
  )
  Simulate.click(button)
  expect(renderSpy).toHaveBeenLastCalledWith(
    expect.objectContaining({isOpen: false}),
  )
})

test('button ignores key events it does not handle', () => {
  const {button, renderSpy} = setup()
  renderSpy.mockClear()
  Simulate.keyDown(button, {key: 's'})
  expect(renderSpy).not.toHaveBeenCalled()
})

test('on button blur resets the state', () => {
  const {button, renderSpy} = setup()
  Simulate.blur(button)
  jest.runAllTimers()
  expect(renderSpy).toHaveBeenLastCalledWith(
    expect.objectContaining({
      isOpen: false,
    }),
  )
})

test('on button blur does not reset the state when the mouse is down', () => {
  const {button, renderSpy} = setup()
  renderSpy.mockClear()
  // mousedown somwhere
  document.body.dispatchEvent(
    new window.MouseEvent('mousedown', {bubbles: true}),
  )
  Simulate.blur(button)
  jest.runAllTimers()
  expect(renderSpy).not.toHaveBeenCalled()
})

test('getToggleButtonProps returns all given props', () => {
  const buttonProps = {'data-foo': 'bar'}
  const Button = jest.fn(props => <button {...props} />)
  setup({buttonProps, Button})
  expect(Button).toHaveBeenCalledTimes(1)
  const context = expect.any(Object)
  expect(Button).toHaveBeenCalledWith(
    expect.objectContaining(buttonProps),
    context,
  )
})

// normally this test would be like the others where we render and then simulate a click on the
// button to ensure that a disabled button cannot be clicked, however this is only a problem in IE11
// so we have to get into the implementation details a little bit (unless we want to run these tests
// in IE11... no thank you 🙅)
test(`getToggleButtonProps doesn't include event handlers when disabled is passed (for IE11 support)`, () => {
  const {getToggleButtonProps} = setup()
  const props = getToggleButtonProps({disabled: true})
  const entry = Object.entries(props).find(
    ([_key, value]) => typeof value === 'function',
  )
  if (entry) {
    throw new Error(
      `getToggleButtonProps should not have any props that are callbacks. It has ${
        entry[0]
      }.`,
    )
  }
})

describe('Expect timer to trigger on process.env.NODE_ENV !== test value', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  test('clicking on the button opens and closes the menu for test', () => {
    process.env.NODE_ENV = 'production'
    const {button, renderSpy} = setup()
    Simulate.click(button)
    jest.runAllTimers()
    expect(renderSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({isOpen: true}),
    )
    Simulate.click(button)
    jest.runAllTimers()
    expect(renderSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({isOpen: false}),
    )
  })
})

function setup({buttonProps, Button = props => <button {...props} />} = {}) {
  let renderArg
  const renderSpy = jest.fn(controllerArg => {
    renderArg = controllerArg
    return (
      <div>
        <Button {...controllerArg.getToggleButtonProps(buttonProps)} />
      </div>
    )
  })
  const utils = render(<Downshift render={renderSpy} />)
  const button = utils.container.querySelector('button')
  return {...utils, button, renderSpy, ...renderArg}
}
