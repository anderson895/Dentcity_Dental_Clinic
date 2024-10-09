import { Form } from 'antd'
import React from 'react'
import { Outlet } from 'react-router-dom'

export default function Public() {
  const [form] = Form.useForm()
  const firstName = Form.useWatch("firstName",form)

  return (
  <div>
  <Outlet />
</div>
)
}
