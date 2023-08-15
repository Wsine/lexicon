import { SettingsIcon } from '@chakra-ui/icons'
import { Container, VStack, Input, Button, Heading } from '@chakra-ui/react'
import { ButtonGroup, Flex, Spacer, Wrap, WrapItem, useToast, IconButton } from '@chakra-ui/react'
import { useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@chakra-ui/react'
import { useState } from 'react'

export default function Index() {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [wordStates, setWordStates] = useState([])
  const handleWordClick = id => {
    setWordStates(prev_wordStates => {
      return prev_wordStates.map(s => {
        if (s.id !== id) return s
        return {
          id: id,
          word: s.word,
          selected: !s.selected
        }
      })
    })
  }

  const toast = useToast()
  const [isLoading, setLoading] = useState(false)
  const handleAddClick = () => {
    setLoading(true)
    const context = document.querySelector('#context').value.trim()
    Promise.all(wordStates.filter(s => s.selected).map(async s => {
      return fetch('/api/add', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-PSK': localStorage.getItem('psk')
        },
        body: JSON.stringify({
          word: s.word,
          context: context
        })
      })
      .then(r => r.json())
      .then(r => {
        console.log(r)
        toast(r.message === 'success' ? {
          title: 'Success',
          status: 'success',
          isClosable: true
        } : {
          title: 'Failed',
          description: r.message,
          status: 'warning',
          isClosable: true
        })
        return new Promise((resolve, reject) => {
          if (r.message === 'success') {
            return resolve(r.message)
          } else {
            return reject(r.message)
          }
        })
      })
      .catch(err => console.warn(err))
    }))
    .then(() => {
      setLoading(false)
      setTimeout(() => close(), 1000)
    })
    .catch(err => console.warn(err))
  }

  return (
    <Container maxW='3xl' mt={4}>
      <VStack spacing={4}>
        <Flex gap={4}>
          <Heading size='lg'>Lexicon Service</Heading>
          <IconButton
            variant='ghost'
            fontSize={24}
            icon={<SettingsIcon />}
            onClick={onOpen}
          />
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Set Key</ModalHeader>
              <ModalBody>
                <Input placeholder='X-Custom-PSK' id='psk' />
              </ModalBody>

              <ModalFooter>
                <Button colorScheme='teal' onClick={() => {
                  const psk = document.querySelector('#psk').value.trim()
                  localStorage.setItem('psk', psk)
                  onClose()
                }}>
                  Save
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Flex>
        <Input
          id='context'
          placeholder='Context sentence'
          autoComplete='off'
          onChange={(e) => {
            const sentence = e.target.value.trim()
            if (sentence.length === 0) return
            const words = sentence.match(/\b(\w+)\b/g)
            setWordStates(words.map((word, index) => {
              return {
                id: index,
                word: word,
                selected: false
              }
            }))
          }}
        />
        <ButtonGroup size='sm' spacing={4} colorScheme='teal'>
          <Wrap>
            {wordStates.map((s, i) => {
              return (
                <WrapItem key={i}>
                  <Button
                    variant={s.selected ? 'outline' : 'ghost'}
                    onClick={() => handleWordClick(s.id) }>
                    {s.word}
                  </Button>
                </WrapItem>
              )
            })}
          </Wrap>
        </ButtonGroup>
        <Flex w='100%'>
          <Spacer />
          <Button
            colorScheme='teal'
            variant='solid'
            isLoading={isLoading}
            loadingText='Submitting'
            onClick={handleAddClick}
          >
            Add
          </Button>
        </Flex>
      </VStack>
    </Container>
  )
}
